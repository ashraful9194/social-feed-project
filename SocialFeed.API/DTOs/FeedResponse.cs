namespace SocialFeed.API.DTOs;

public class FeedResponse
{
    public List<PostResponse> Posts { get; set; } = new();
    public DateTime? NextCursorCreatedAt { get; set; }
    public int? NextCursorId { get; set; }
    public bool HasMore { get; set; }
}