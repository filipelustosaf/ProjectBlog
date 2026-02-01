using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Blog.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Controllers;

[ApiController]
[Route("users")]
[Authorize(Roles = "ADMIN")]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(UserManager<AppUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public record CreateUserRequest(
        [Required, EmailAddress, MaxLength(256)] string Email,
        [Required, MinLength(6)] string Password,
        [MaxLength(256)] string? UserName
    );

    public record UpdateUserRequest(
        [Required, EmailAddress, MaxLength(256)] string Email,
        [MaxLength(256)] string? UserName
    );

    public record SetRolesRequest(string[] Roles);
    public record SetRoleRequest(string Role);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userManager.Users
            .OrderBy(u => u.Email)
            .ToListAsync();

        var result = new List<object>(users.Count);

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);

            result.Add(new
            {
                u.Id,
                u.Email,
                u.UserName,
                Roles = roles
            });
        }

        return Ok(result);
    }

    [HttpGet("{id:length(1,450)}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new { user.Id, user.Email, user.UserName, Roles = roles });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest req)
    {
        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var password = (req.Password ?? "").Trim();
        var userName = (req.UserName ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return BadRequest("Email and password are required.");

        if (string.IsNullOrWhiteSpace(userName))
            userName = email;

        var existingByEmail = await _userManager.FindByEmailAsync(email);
        if (existingByEmail is not null)
            return BadRequest("A user with that email address already exists.");

        var existingByUserName = await _userManager.FindByNameAsync(userName);
        if (existingByUserName is not null)
            return BadRequest("A user with that username already exists.");

        var user = new AppUser
        {
            Email = email,
            UserName = userName
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        if (!await _roleManager.RoleExistsAsync("USER"))
            await _roleManager.CreateAsync(new IdentityRole("USER"));

        await _userManager.AddToRoleAsync(user, "USER");

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id, user.Email, user.UserName });
    }

    [HttpPut("{id:length(1,450)}")]
    public async Task<IActionResult> Update(string id, UpdateUserRequest req)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var email = (req.Email ?? "").Trim().ToLowerInvariant();
        var userName = (req.UserName ?? "").Trim();

        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Email is mandatory.");

        if (string.IsNullOrWhiteSpace(userName))
            userName = email;

        var existingByEmail = await _userManager.FindByEmailAsync(email);
        if (existingByEmail is not null && existingByEmail.Id != user.Id)
            return BadRequest("A user with that email address already exists.");

        var existingByUserName = await _userManager.FindByNameAsync(userName);
        if (existingByUserName is not null && existingByUserName.Id != user.Id)
            return BadRequest("A user with that username already exists.");

        var setEmail = await _userManager.SetEmailAsync(user, email);
        if (!setEmail.Succeeded)
        {
            return BadRequest(new
            {
                errors = setEmail.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        var setUserName = await _userManager.SetUserNameAsync(user, userName);
        if (!setUserName.Succeeded)
        {
            return BadRequest(new
            {
                errors = setUserName.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return Ok(new { user.Id, user.Email, user.UserName });
    }

    [HttpDelete("{id:length(1,450)}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(currentUserId) && id == currentUserId)
            return BadRequest("You cannot delete your own user account.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return NoContent();
    }

    [HttpPut("{id:length(1,450)}/roles")]
    public async Task<IActionResult> SetRoles(string id, SetRolesRequest req)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var roles = (req?.Roles ?? Array.Empty<string>())
            .Select(r => (r ?? "").Trim().ToUpperInvariant())
            .Where(r => r is "USER" or "ADMIN")
            .Distinct()
            .ToArray();

        if (roles.Length == 0)
            roles = new[] { "USER" };

        if (!string.IsNullOrWhiteSpace(currentUserId) && id == currentUserId && !roles.Contains("ADMIN"))
            return BadRequest("You cannot remove your own ADMIN role.");

        foreach (var role in roles)
            if (!await _roleManager.RoleExistsAsync(role))
                await _roleManager.CreateAsync(new IdentityRole(role));

        var currentRoles = await _userManager.GetRolesAsync(user);

        var remove = currentRoles.Except(roles).ToArray();
        var add = roles.Except(currentRoles).ToArray();

        if (remove.Length > 0) await _userManager.RemoveFromRolesAsync(user, remove);
        if (add.Length > 0) await _userManager.AddToRolesAsync(user, add);

        var updated = await _userManager.GetRolesAsync(user);
        return Ok(new { user.Id, user.Email, Roles = updated });
    }

    [HttpPut("{id:length(1,450)}/role")]
    public async Task<IActionResult> SetRole(string id, SetRoleRequest req)
    {
        var role = (req?.Role ?? "").Trim().ToUpperInvariant();
        if (role is not ("ADMIN" or "USER"))
            return BadRequest("The role must be ADMIN or USER.");

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!string.IsNullOrWhiteSpace(currentUserId) && id == currentUserId && role == "USER")
            return BadRequest("You cannot remove your own ADMIN role.");

        if (!await _roleManager.RoleExistsAsync(role))
            await _roleManager.CreateAsync(new IdentityRole(role));

        var currentRoles = await _userManager.GetRolesAsync(user);

        foreach (var r in currentRoles.Where(r => r is "ADMIN" or "USER"))
            await _userManager.RemoveFromRoleAsync(user, r);

        var add = await _userManager.AddToRoleAsync(user, role);
        if (!add.Succeeded)
        {
            return BadRequest(new
            {
                errors = add.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return Ok(new { user.Id, user.Email, Role = role });
    }
}
