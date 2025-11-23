import Navbar from '../components/layout/Navbar';
import ThemeToggle from '../components/layout/ThemeToggle';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import CreatePostBox from '../components/feed/CreatePostBox';
import PostCard from '../components/feed/PostCard';
import Stories from '../components/feed/Stories'; // Import Stories

const FeedPage = () => {
    return (
        <>
            <Navbar />

            <div className="_layout _layout_main_wrapper">
                <ThemeToggle />
                <div className="_main_layout">
                    <div className="container _custom_container">
                        <div className="_layout_inner_wrap">
                            <div className="row">

                                <LeftSidebar />

                                {/* --- MIDDLE COLUMN --- */}
                                <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                                    <div className="_layout_middle_wrap">
                                        <div className="_layout_middle_inner">

                                            {/* 1. STORIES SECTION (Added) */}
                                            <Stories />

                                            {/* 2. CREATE POST BOX */}
                                            <CreatePostBox />

                                            {/* 3. FEED POSTS */}
                                            <PostCard
                                                authorName="Karim Saif"
                                                authorAvatar="/assets/images/post_img.png"
                                                timeAgo="5 minutes ago"
                                                content="-Healthy Tracking App" // Updated text to match screenshot
                                                postImage="/assets/images/timeline_img.png"
                                                initialLikes={9}
                                                initialComments={12}
                                                initialShares={122} // Added prop
                                                showComments={true} // <--- THIS IS THE KEY CHANGE
                                            />

                                            <PostCard
                                                authorName="Karim Saif" // Updated author to match screenshot logic if needed
                                                authorAvatar="/assets/images/post_img.png"
                                                timeAgo="5 minutes ago"
                                                content="Healthy Tracking App Update! Just finished the new module."
                                                postImage="/assets/images/timeline_img.png"
                                                initialLikes={1200}
                                                initialComments={450}
                                                initialShares={12}
                                                showComments={false} // Hidden for second post
                                            />

                                        </div>
                                    </div>
                                </div>
                                {/* --- END MIDDLE COLUMN --- */}

                                <RightSidebar />

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FeedPage;