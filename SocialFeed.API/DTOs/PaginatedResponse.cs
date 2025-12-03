namespace SocialFeed.API.DTOs;

public record PaginatedResponse<T>(
    List<T> Items,
    int? NextCursor
);
