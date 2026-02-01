using Blog.Api.Models;
using Blog.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Blog.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly TokenService _tokenService;

    public AuthController(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        TokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    public record RegisterRequest(string Email, string Password);
    public record LoginRequest(string Email, string Password);

    public record AuthResponse(string? Token, string Id, string Email, string UserName, string[] Roles);

    private async Task<AuthResponse> BuildAuthResponseAsync(AppUser user, string? token)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new AuthResponse(
            Token: token,
            Id: user.Id,
            Email: user.Email ?? "",
            UserName: user.UserName ?? "",
            Roles: roles.ToArray()
        );
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        var resp = await BuildAuthResponseAsync(user, token: null);
        return Ok(resp);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var user = new AppUser
        {
            UserName = req.Email,
            Email = req.Email
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        if (!await _userManager.IsInRoleAsync(user, "USER"))
            await _userManager.AddToRoleAsync(user, "USER");

        var token = await _tokenService.GenerateTokenAsync(user);

        // recarrega user (pra garantir consistência caso algo mude)
        user = await _userManager.FindByEmailAsync(req.Email) ?? user;

        var resp = await BuildAuthResponseAsync(user, token);
        return Ok(resp);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user is null) return Unauthorized("Invalid credentials");

        var check = await _signInManager.CheckPasswordSignInAsync(user, req.Password, false);
        if (!check.Succeeded) return Unauthorized("Invalid credentials");

        var token = await _tokenService.GenerateTokenAsync(user);
        var resp = await BuildAuthResponseAsync(user, token);

        return Ok(resp);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logout successful" });
    }
}
