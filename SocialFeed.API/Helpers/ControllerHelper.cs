using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace SocialFeed.API.Helpers;

public static class ControllerHelper
{
    /// <summary>
    /// Extracts the current user ID from JWT token claims
    /// </summary>
    public static int GetCurrentUserId(this ControllerBase controller)
    {
        var claim = controller.User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null) throw new UnauthorizedAccessException("User ID not found in token.");
        return int.Parse(claim.Value);
    }

    /// <summary>
    /// Handles exceptions and returns appropriate HTTP responses
    /// </summary>
    public static ActionResult HandleException(Exception ex)
    {
        return ex switch
        {
            KeyNotFoundException => new NotFoundObjectResult(new { message = ex.Message }),
            ArgumentException => new BadRequestObjectResult(new { message = ex.Message }),
            UnauthorizedAccessException => new UnauthorizedObjectResult(new { message = ex.Message }),
            InvalidOperationException => new BadRequestObjectResult(new { message = ex.Message }),
            _ => new ObjectResult(new { message = "An error occurred while processing your request." })
            {
                StatusCode = 500
            }
        };
    }
}

