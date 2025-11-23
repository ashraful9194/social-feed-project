namespace SocialFeed.API.Entities;

public class PostLike
{
    public int PostId { get; set; }
    public int UserId { get; set; }
    
    // Navigations
    public Post Post { get; set; } = null!;
    public User User { get; set; } = null!;
}