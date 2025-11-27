using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace SocialFeed.API.Services;

public interface IGcpStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string fileName);
}

public class GcpStorageService : IGcpStorageService
{
    private readonly StorageClient _storageClient;
    private readonly string _bucketName;

    public GcpStorageService(IConfiguration configuration)
    {
        _bucketName = configuration["GCP:BucketName"] 
                      ?? throw new ArgumentNullException("GCP:BucketName is missing in configuration.");
        
        // In Cloud Run, credentials are automatically detected (Application Default Credentials).
        // Locally, you can set GOOGLE_APPLICATION_CREDENTIALS environment variable.
        _storageClient = StorageClient.Create();
    }

    public async Task<string> UploadFileAsync(IFormFile file, string fileName)
    {
        using var stream = file.OpenReadStream();
        var objectName = $"uploads/{fileName}";

        // Upload to GCS
        await _storageClient.UploadObjectAsync(_bucketName, objectName, file.ContentType, stream);

        // Return the public URL
        // Note: The bucket must be configured to allow public access to these objects,
        // or we need to generate a signed URL. For a social feed, public read access is standard.
        return $"https://storage.googleapis.com/{_bucketName}/{objectName}";
    }
}
