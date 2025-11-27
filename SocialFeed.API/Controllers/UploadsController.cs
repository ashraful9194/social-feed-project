using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialFeed.API.DTOs;
using SocialFeed.API.Services;

namespace SocialFeed.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UploadsController : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB
    private readonly IGcpStorageService _gcpStorageService;

    public UploadsController(IGcpStorageService gcpStorageService)
    {
        _gcpStorageService = gcpStorageService;
    }

    [HttpPost("post-image")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<ActionResult<UploadResponse>> UploadPostImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("File is required.");
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest("File exceeds 5 MB limit.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest("Only JPG, PNG, GIF, and WEBP are allowed.");
        }

        try 
        {
            var fileName = $"{Guid.NewGuid():N}{extension}";
            var publicUrl = await _gcpStorageService.UploadFileAsync(file, fileName);
            return Ok(new UploadResponse(publicUrl, file.FileName, file.Length));
        }
        catch (Exception ex)
        {
            // Log the error
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}

