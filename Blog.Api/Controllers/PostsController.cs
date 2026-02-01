using System.Security.Claims;
using Blog.Api.Data;
using Blog.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Blog.Api.Controllers;

[ApiController]
[Route("posts")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PostsController(AppDbContext db) => _db = db;

    public record CreatePostRequest(
        [Required, MaxLength(200)] string Title,
        [Required, MinLength(1)] string Content
    );

    public record UpdatePostRequest(
        [Required, MaxLength(200)] string Title,
        [Required, MinLength(1)] string Content
    );

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _db.Posts
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CreatedAt,
                p.AuthorId,
                AuthorEmail = p.Author != null ? p.Author.Email : null
            })
            .ToListAsync();

        return Ok(posts);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _db.Posts
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CreatedAt,
                p.AuthorId,
                AuthorEmail = p.Author != null ? p.Author.Email : null
            })
            .FirstOrDefaultAsync();

        return post is null ? NotFound() : Ok(post);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePostRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var post = new Post
        {
            Title = req.Title,
            Content = req.Content,
            CreatedAt = DateTime.UtcNow,
            AuthorId = userId
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        var dto = await _db.Posts
            .Where(p => p.Id == post.Id)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CreatedAt,
                p.AuthorId,
                AuthorEmail = p.Author != null ? p.Author.Email : null
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdatePostRequest req)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("ADMIN");

        if (post.AuthorId != userId && !isAdmin)
            return Forbid();

        post.Title = req.Title;
        post.Content = req.Content;

        await _db.SaveChangesAsync();

        var dto = await _db.Posts
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Content,
                p.CreatedAt,
                p.AuthorId,
                AuthorEmail = p.Author != null ? p.Author.Email : null
            })
            .FirstAsync();

        return Ok(dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("ADMIN");

        if (post.AuthorId != userId && !isAdmin)
            return Forbid();

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();

        return NoContent();
    }


}
