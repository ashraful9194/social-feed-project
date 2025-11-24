import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import ThemeToggle from '../components/layout/ThemeToggle';
import CreatePostBox from '../components/feed/CreatePostBox';
import PostCard from '../components/feed/PostCard';
import type { PostResponse } from '../types/feed';
import { postService } from '../services/PostService';

const FeedPage = () => {
    const [posts, setPosts] = useState<PostResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFeed = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await postService.getFeed();
            setPosts(data);
        } catch (err) {
            console.error(err);
            setError('Unable to load feed. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadFeed();
    }, []);

    const handlePostCreated = (post: PostResponse) => {
        setPosts((prev) => [post, ...prev]);
    };

    return (
        <>
            <Navbar />

            <div className="_layout _layout_main_wrapper">
                <ThemeToggle />
                <div className="_main_layout">
                    <div className="container _custom_container">
                        <div className="_layout_inner_wrap">
                            <div className="row justify-content-center">
                                <div className="col-xl-8 col-lg-9 col-md-12 col-sm-12">
                                    <div className="_layout_middle_wrap">
                                        <div className="_layout_middle_inner">
                                            <CreatePostBox onPostCreated={handlePostCreated} />

                                            {loading && <p>Loading feed...</p>}
                                            {error && (
                                                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                                                    <span>{error}</span>
                                                    <button className="btn btn-sm btn-light" onClick={loadFeed}>
                                                        Retry
                                                    </button>
                                                </div>
                                            )}

                                            {!loading && posts.length === 0 && <p>No posts yet. Create the first one!</p>}

                                            {posts.map((post) => (
                                                <PostCard key={post.id} post={post} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FeedPage;