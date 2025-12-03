import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommentResponse, LikeUserResponse, PostResponse } from '../../types/feed';
import { postService } from '../../services/PostService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getErrorMessage } from '../../utils/errorHandler';
import { DEFAULT_AVATAR } from '../../config/constants';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
    post: PostResponse;
}

type LikeHoverStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface LikeHoverMeta {
    users: LikeUserResponse[];
    status: LikeHoverStatus;
    visible: boolean;
    error?: string | null;
}

const createEmptyLikeMeta = (): LikeHoverMeta => ({
    users: [],
    status: 'idle',
    visible: false,
    error: null,
});

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
    const [postLikesMeta, setPostLikesMeta] = useState<LikeHoverMeta>(createEmptyLikeMeta());
    const [commentLikesMeta, setCommentLikesMeta] = useState<Record<number, LikeHoverMeta>>({});
    const { getUser, getUserAvatar } = useAuth();
    const currentUser = getUser();
    const currentUserAvatar = getUserAvatar();

    const hasLoadedComments = useMemo(() => comments.length > 0, [comments]);

    useEffect(() => {
        setPostLikesMeta(createEmptyLikeMeta());
    }, [likesCount, post.id]);

    const toggleLike = async () => {
        try {
            const result = await postService.togglePostLike(post.id);
            setLikesCount(result.totalLikes);
            setIsLiked(result.isLiked);
            setPostLikesMeta(createEmptyLikeMeta());
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }
    };

    const fetchPostLikes = async () => {
        try {
            setPostLikesMeta((prev) => ({ ...prev, status: 'loading', error: null }));
            const response = await postService.getPostLikes(post.id);
            setPostLikesMeta((prev) => ({
                ...prev,
                status: 'loaded',
                users: response.items,
                error: null
            }));
        } catch (err) {
            console.error(err);
            setPostLikesMeta((prev) => ({
                ...prev,
                status: 'error',
                error: 'Unable to load likes.'
            }));
        }
    };

    const handlePostLikesEnter = () => {
        if (!likesCount) return;
        setPostLikesMeta((prev) => ({ ...prev, visible: true }));
        if (postLikesMeta.status === 'idle') {
            void fetchPostLikes();
        }
    };

    const handlePostLikesLeave = () => {
        setPostLikesMeta((prev) => ({ ...prev, visible: false }));
    };

    const sortCommentsDesc = (items: CommentResponse[]): CommentResponse[] =>
        [...items]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((item) => ({
                ...item,
                replies: sortCommentsDesc(item.replies)
            }));

    const loadComments = useCallback(async () => {
        if (hasLoadedComments) return;
        try {
            setLoadingComments(true);
            const response = await postService.getComments(post.id);
            setComments(sortCommentsDesc(response.items));
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
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
                    return [created, ...prev];
                }

                const addReply = (items: CommentResponse[]): CommentResponse[] =>
                    items.map((item) => {
                        if (item.id === parentCommentId) {
                            const updatedReplies = sortCommentsDesc([created, ...item.replies]);
                            return { ...item, replies: updatedReplies };
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
                setReplyDrafts((prev) => {
                    const updated = { ...prev };
                    delete updated[parentCommentId];
                    return updated;
                });
            } else {
                setNewComment('');
            }
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
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

            setComments((prev) => sortCommentsDesc(updateTree(prev)));
            setCommentLikesMeta((prev) => {
                if (!prev[commentId]) return prev;
                const updated = { ...prev };
                delete updated[commentId];
                return updated;
            });
        } catch (err) {
            console.error(err);
            setError(getErrorMessage(err));
        }
    };

    const fetchCommentLikes = async (commentId: number) => {
        try {
            setCommentLikesMeta((prev) => ({
                ...prev,
                [commentId]: {
                    ...(prev[commentId] ?? createEmptyLikeMeta()),
                    status: 'loading',
                    error: null,
                    visible: true
                }
            }));
            const response = await postService.getCommentLikes(commentId);
            setCommentLikesMeta((prev) => ({
                ...prev,
                [commentId]: {
                    ...(prev[commentId] ?? createEmptyLikeMeta()),
                    status: 'loaded',
                    users: response.items,
                    error: null,
                    visible: true
                }
            }));
        } catch (err) {
            console.error(err);
            setCommentLikesMeta((prev) => ({
                ...prev,
                [commentId]: {
                    ...(prev[commentId] ?? createEmptyLikeMeta()),
                    status: 'error',
                    error: getErrorMessage(err),
                    visible: true,
                },
            }));
        }
    };

    const handleCommentLikesEnter = (commentId: number, totalLikes: number) => {
        if (!totalLikes) return;
        setCommentLikesMeta((prev) => ({
            ...prev,
            [commentId]: {
                ...(prev[commentId] ?? createEmptyLikeMeta()),
                visible: true
            }
        }));

        const meta = commentLikesMeta[commentId];
        if (!meta || meta.status === 'idle') {
            void fetchCommentLikes(commentId);
        }
    };

    const handleCommentLikesLeave = (commentId: number) => {
        setCommentLikesMeta((prev) => {
            if (!prev[commentId]) return prev;
            return {
                ...prev,
                [commentId]: {
                    ...prev[commentId],
                    visible: false
                }
            };
        });
    };

    const renderLikeTooltip = (meta: LikeHoverMeta | undefined, config?: { align?: 'left' | 'right'; position?: 'top' | 'bottom' }) => {
        const resolved = meta ?? createEmptyLikeMeta();
        if (!resolved.visible) return null;

        const align = config?.align ?? 'left';
        const position = config?.position ?? 'bottom';

        const style: React.CSSProperties = {
            position: 'absolute',
            zIndex: 20,
            width: 220,
            backgroundColor: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            padding: 12
        };

        if (align === 'left') {
            style.left = 0;
        } else {
            style.right = 0;
        }

        if (position === 'bottom') {
            style.top = 'calc(100% + 8px)';
        } else {
            style.bottom = 'calc(100% + 8px)';
        }

        const content = (() => {
            if (resolved.status === 'loading') {
                return <p style={{ fontSize: 13, color: '#65676B', margin: 0 }}>Loading likes...</p>;
            }
            if (resolved.status === 'error') {
                return <p style={{ fontSize: 13, color: '#dc3545', margin: 0 }}>{resolved.error ?? 'Unable to load likes.'}</p>;
            }
            if (resolved.users.length === 0) {
                return <p style={{ fontSize: 13, color: '#65676B', margin: 0 }}>No likes yet.</p>;
            }
            return (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 220, overflowY: 'auto' }}>
                    {resolved.users.map((user) => (
                        <li key={user.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                            <img
                                src={user.avatarUrl ?? DEFAULT_AVATAR}
                                alt={user.fullName}
                                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span style={{ fontSize: 13, color: '#050505' }}>{user.fullName}</span>
                        </li>
                    ))}
                </ul>
            );
        })();

        return (
            <div style={style}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#050505', marginBottom: 8 }}>Liked by</p>
                {content}
            </div>
        );
    };

    // --- REFACTORED RENDER FUNCTION FOR FACEBOOK STYLE ---
    const renderComments = (items: CommentResponse[], depth = 0) =>
        items.map((comment) => (
            <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: 12, marginLeft: depth ? 20 : 0 }}>

                {/* Main Comment Row: Avatar + Bubble */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>

                    {/* Avatar */}
                    <img
                        src={comment.authorAvatar ?? DEFAULT_AVATAR}
                        alt={comment.authorName}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 'calc(100% - 40px)' }}>

                        {/* The Grey "Bubble" */}
                        <div style={{
                            position: 'relative',
                            backgroundColor: '#F0F2F5',
                            borderRadius: '18px',
                            padding: '8px 12px',
                            display: 'inline-block',
                            color: '#050505'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: '1.2' }}>
                                {comment.authorName}
                            </div>
                            <div style={{ fontSize: '15px', lineHeight: '1.4', marginTop: 2 }}>
                                {comment.content}
                            </div>

                            {/* Floating Like Count Badge (Bottom Right of Bubble) */}
                            {comment.likesCount > 0 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: -10,
                                        right: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        gap: 6,
                                        zIndex: 1
                                    }}
                                    onMouseEnter={() => handleCommentLikesEnter(comment.id, comment.likesCount)}
                                    onMouseLeave={() => handleCommentLikesLeave(comment.id)}
                                >
                                    <div
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '10px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            padding: '2px 4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            fontSize: '11px'
                                        }}
                                    >
                                        <span style={{ backgroundColor: '#1877F2', borderRadius: '50%', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14 }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#fff" width="8" height="8"><path d="M8.856.884c.834.332 1.58.917 1.63 1.956.12.392-.09.83-.24 1.205l-.01.026s-.066.155-.065.155c-.01.025-.018.05-.028.075.688.163 1.838.59 2.158 1.408.435 1.109-.17 2.396-1.125 2.873.344.474.349 1.157.067 1.62-.27.442-.857.702-1.342.805.122.427-.058.914-.37 1.21-.397.377-1.104.53-1.638.577h-.066c-.636.002-1.42.062-1.895-.298-.445-.337-.532-1.012-.662-1.573-.133-.572-.257-1.144-.73-1.503-.306-.233-.7-.272-1.077-.28h-1.6c-.653.003-1.16-.547-1.127-1.2l.065-2.613c.038-.642.59-1.14 1.233-1.127h.063c.277 0 .524-.094.707-.268.324-.308.384-.816.516-1.237.2-.644.59-1.42 1.163-1.84.77-.565 1.706-.39 2.378.026z" /></svg>
                                        </span>
                                        <span style={{ color: '#65676B' }}>{comment.likesCount}</span>
                                    </div>
                                    {renderLikeTooltip(commentLikesMeta[comment.id], { align: 'right', position: 'top' })}
                                </div>
                            )}
                        </div>

                        {/* Action Row: Like, Reply, Date */}
                        <div style={{ display: 'flex', gap: 12, marginLeft: 12, marginTop: 4, fontSize: '12px', color: '#65676B' }}>
                            <button
                                onClick={() => handleCommentLike(comment.id)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    padding: 0,
                                    fontWeight: 'bold',
                                    color: comment.isLikedByCurrentUser ? '#1877F2' : '#65676B',
                                    cursor: 'pointer'
                                }}
                            >
                                Like
                            </button>
                            <button
                                onClick={() => setReplyDrafts((prev) => ({ ...prev, [comment.id]: prev[comment.id] ?? '' }))}
                                style={{ border: 'none', background: 'none', padding: 0, fontWeight: 'bold', color: '#65676B', cursor: 'pointer' }}
                            >
                                Reply
                            </button>
                            <span>{formatTimeAgo(comment.createdAt)}</span>
                        </div>

                    </div>
                </div>

                {/* Reply Input */}
                {replyDrafts[comment.id] !== undefined && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, paddingLeft: 40 }}>
                        <img
                            src={currentUserAvatar}
                            alt={currentUser?.name ?? 'You'}
                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                        />
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    backgroundColor: '#F0F2F5',
                                    border: 'none',
                                    borderRadius: '18px',
                                    padding: '8px 12px',
                                    fontSize: '14px'
                                }}
                                autoFocus
                                value={replyDrafts[comment.id]}
                                onChange={(event) =>
                                    setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateComment(comment.id);
                                }}
                                placeholder={`Reply to ${comment.authorName}...`}
                            />
                            <div style={{ textAlign: 'right', marginTop: 4 }}>
                                <small style={{ cursor: 'pointer', color: '#65676B' }} onClick={() => setReplyDrafts(prev => { const n = { ...prev }; delete n[comment.id]; return n; })}>Cancel</small>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nested Replies */}
                {comment.replies.length > 0 && (
                    <div style={{ marginTop: 8 }}>{renderComments(comment.replies, depth + 1)}</div>
                )}
            </div>
        ));

    return (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
            <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
                <div className="_feed_inner_timeline_post_top">
                    <div className="_feed_inner_timeline_post_box">
                        <div className="_feed_inner_timeline_post_box_image">
                            <img src={post.authorAvatar ?? DEFAULT_AVATAR} alt="" className="_post_img" />
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
                    <div
                        style={{ position: 'relative', display: 'inline-block' }}
                        onMouseEnter={handlePostLikesEnter}
                        onMouseLeave={handlePostLikesLeave}
                    >
                        <p className="_feed_inner_timeline_total_reacts_para1">
                            <span>{likesCount}</span> Likes
                        </p>
                        {likesCount > 0 && renderLikeTooltip(postLikesMeta, { align: 'left', position: 'bottom' })}
                    </div>
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
                    {/* Main Comment Input Area */}
                    <div className="_feed_inner_comment_box" style={{ alignItems: 'flex-start' }}>
                        <div className="_feed_inner_comment_box_content" style={{ width: '100%' }}>
                            <div className="_feed_inner_comment_box_content_image">
                                <img src={currentUserAvatar} alt={currentUser?.name ?? 'You'} className="_comment_img" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            </div>
                            <div className="_feed_inner_comment_box_content_txt" style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{
                                        borderRadius: '20px',
                                        backgroundColor: '#F0F2F5',
                                        border: 'none',
                                        padding: '8px 12px',
                                        width: '100%'
                                    }}
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(event) => setNewComment(event.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateComment();
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {loadingComments && <p className="_mar_t12" style={{ paddingLeft: 24, fontSize: 13, color: '#666' }}>Loading comments...</p>}

                    {!loadingComments && comments.length > 0 && (
                        <div className="_timline_comment_main" style={{ marginTop: 20 }}>
                            {renderComments(comments)}
                        </div>
                    )}
                </div>
            )}

            {error && <p className="text-danger _padd_l24 _padd_r24 _mar_t12">{error}</p>}
        </div>
    );
};

export default PostCard;