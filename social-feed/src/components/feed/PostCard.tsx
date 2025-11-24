import React, { useCallback, useMemo, useState } from 'react';
import type { CommentResponse, PostResponse } from '../../types/feed';
import { postService } from '../../services/PostService';

interface PostCardProps {
    post: PostResponse;
}

const formatTimeAgo = (isoDate: string) => {
    const created = new Date(isoDate);
    const diffMs = Date.now() - created.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return created.toLocaleDateString();
};

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
    const [error, setError] = useState<string | null>(null);

    const hasLoadedComments = useMemo(() => comments.length > 0, [comments]);

    const toggleLike = async () => {
        try {
            const result = await postService.togglePostLike(post.id);
            setLikesCount(result.totalLikes);
            setIsLiked(result.isLiked);
        } catch (err) {
            console.error(err);
            setError('Unable to update like.');
        }
    };

    const loadComments = useCallback(async () => {
        if (hasLoadedComments) return;
        try {
            setLoadingComments(true);
            const response = await postService.getComments(post.id);
            setComments(response);
        } catch (err) {
            console.error(err);
            setError('Unable to load comments.');
        } finally {
            setLoadingComments(false);
        }
    }, [hasLoadedComments, post.id]);

    const handleToggleComments = async () => {
        const nextState = !showComments;
        setShowComments(nextState);
        if (nextState && !hasLoadedComments) {
            await loadComments();
        }
    };

    const handleCreateComment = async (parentCommentId?: number) => {
        const text = parentCommentId
            ? replyDrafts[parentCommentId]?.trim()
            : newComment.trim();

        if (!text) {
            setError('Comment cannot be empty.');
            return;
        }

        try {
            setError(null);
            const created = await postService.createComment(post.id, {
                content: text,
                parentCommentId
            });

            setComments((prev) => {
                if (!parentCommentId) {
                    return [...prev, created];
                }

                const addReply = (items: CommentResponse[]): CommentResponse[] =>
                    items.map((item) => {
                        if (item.id === parentCommentId) {
                            return { ...item, replies: [...item.replies, created] };
                        }
                        if (item.replies.length) {
                            return { ...item, replies: addReply(item.replies) };
                        }
                        return item;
                    });

                return addReply(prev);
            });

            setCommentsCount((prev) => prev + 1);
            if (parentCommentId) {
                setReplyDrafts((prev) => ({ ...prev, [parentCommentId]: '' }));
            } else {
                setNewComment('');
            }
        } catch (err) {
            console.error(err);
            setError('Unable to add comment.');
        }
    };

    const handleCommentLike = async (commentId: number) => {
        try {
            const result = await postService.toggleCommentLike(commentId);

            const updateTree = (items: CommentResponse[]): CommentResponse[] =>
                items.map((item) => {
                    if (item.id === commentId) {
                        return {
                            ...item,
                            isLikedByCurrentUser: result.isLiked,
                            likesCount: result.totalLikes
                        };
                    }
                    if (item.replies.length) {
                        return { ...item, replies: updateTree(item.replies) };
                    }
                    return item;
                });

            setComments((prev) => updateTree(prev));
        } catch (err) {
            console.error(err);
            setError('Unable to like comment.');
        }
    };

    const renderComments = (items: CommentResponse[], depth = 0) =>
        items.map((comment) => (
            <div key={comment.id} className="_comment_main" style={{ marginLeft: depth ? depth * 24 : 0 }}>
                <div className="_comment_image">
                    <img src={comment.authorAvatar ?? '/assets/images/txt_img.png'} alt="" className="_comment_img1" />
                </div>
                <div className="_comment_area">
                    <div className="_comment_details">
                        <div className="_comment_details_top">
                            <div className="_comment_name">
                                <h4 className="_comment_name_title">{comment.authorName}</h4>
                            </div>
                        </div>
                        <div className="_comment_status">
                            <p className="_comment_status_text">
                                <span>{comment.content}</span>
                            </p>
                        </div>
                        <div className="_total_reactions">
                            <button
                                type="button"
                                className={`_reaction_like ${comment.isLikedByCurrentUser ? 'text-primary' : ''}`}
                                onClick={() => handleCommentLike(comment.id)}
                            >
                                👍 {comment.likesCount}
                            </button>
                            <button
                                type="button"
                                className="_reaction_like _mar_l10"
                                onClick={() => setReplyDrafts((prev) => ({ ...prev, [comment.id]: prev[comment.id] ?? '' }))}
                            >
                                Reply
                            </button>
                        </div>
                        {replyDrafts[comment.id] !== undefined && (
                            <div className="_comment_reply_form">
                                <textarea
                                    className="form-control _comment_textarea _mar_t10"
                                    value={replyDrafts[comment.id]}
                                    onChange={(event) =>
                                        setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))
                                    }
                                    placeholder="Write a reply..."
                                />
                                <button
                                    type="button"
                                    className="_feed_inner_text_area_btn_link _mar_t10"
                                    onClick={() => handleCreateComment(comment.id)}
                                >
                                    Reply
                                </button>
                            </div>
                        )}
                    </div>
                    {comment.replies.length > 0 && (
                        <div className="_comment_replies">{renderComments(comment.replies, depth + 1)}</div>
                    )}
                </div>
            </div>
        ));

    return (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
            <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
                <div className="_feed_inner_timeline_post_top">
                    <div className="_feed_inner_timeline_post_box">
                        <div className="_feed_inner_timeline_post_box_image">
                            <img src={post.authorAvatar ?? '/assets/images/post_img.png'} alt="" className="_post_img" />
                        </div>
                        <div className="_feed_inner_timeline_post_box_txt">
                            <h4 className="_feed_inner_timeline_post_box_title">{post.authorName}</h4>
                            <p className="_feed_inner_timeline_post_box_para">
                                {formatTimeAgo(post.createdAt)} . <span>{post.isPrivate ? 'Private' : 'Public'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <h4 className="_feed_inner_timeline_post_title">{post.content}</h4>
                {post.imageUrl && (
                    <div className="_feed_inner_timeline_image">
                        <img src={post.imageUrl} alt="" className="_time_img" />
                    </div>
                )}
            </div>

            <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26">
                <div className="_feed_inner_timeline_total_reacts_txt">
                    <p className="_feed_inner_timeline_total_reacts_para1">
                        <span>{likesCount}</span> Likes
                    </p>
                    <p className="_feed_inner_timeline_total_reacts_para2">
                        <span>{commentsCount}</span> Comments
                    </p>
                </div>
            </div>

            <div className="_feed_inner_timeline_reaction">
                <button
                    className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${isLiked ? '_feed_reaction_active' : ''}`}
                    onClick={toggleLike}
                >
                    <span className="_feed_inner_timeline_reaction_link">
                        <span className="_mar_r10">❤️</span>
                        {isLiked ? 'Liked' : 'Like'}
                    </span>
                </button>

                <button className="_feed_inner_timeline_reaction_comment _feed_reaction" onClick={handleToggleComments}>
                    <span className="_feed_inner_timeline_reaction_link">
                        <span className="_mar_r10">💬</span>
                        Comments
                    </span>
                </button>
            </div>

            {showComments && (
                <div className="_feed_inner_timeline_cooment_area">
                    <div className="_feed_inner_comment_box">
                        <div className="_feed_inner_comment_box_content">
                            <div className="_feed_inner_comment_box_content_image">
                                <img src="/assets/images/comment_img.png" alt="" className="_comment_img" />
                            </div>
                            <div className="_feed_inner_comment_box_content_txt">
                                <textarea
                                    className="form-control _comment_textarea"
                                    placeholder="Write a comment"
                                    value={newComment}
                                    onChange={(event) => setNewComment(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="_feed_inner_text_area_btn _mar_t10">
                            <button
                                type="button"
                                className="_feed_inner_text_area_btn_link"
                                onClick={() => handleCreateComment()}
                            >
                                Comment
                            </button>
                        </div>
                    </div>

                    {loadingComments && <p className="_mar_t12">Loading comments...</p>}
                    {!loadingComments && comments.length === 0 && <p className="_mar_t12">Be the first to comment!</p>}
                    {!loadingComments && comments.length > 0 && (
                        <div className="_timline_comment_main">{renderComments(comments)}</div>
                    )}
                </div>
            )}

            {error && <p className="text-danger _padd_l24 _padd_r24 _mar_t12">{error}</p>}
        </div>
    );
};

export default PostCard;