namespace SocialFeed.API.Entities;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string ProfileImageUrl { get; set; } = "/assets/images/Avatar.png";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public List<Post> Posts { get; set; } = new();
}