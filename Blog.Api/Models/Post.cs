using Blog.Api.Models;
using System.ComponentModel.DataAnnotations;

public class Post
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = "";

    [Required]
    public string Content { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public string AuthorId { get; set; } = "";
    public AppUser? Author { get; set; }
}
