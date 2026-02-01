using Blog.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace Blog.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();

        if (!await roleManager.RoleExistsAsync("ADMIN"))
            await roleManager.CreateAsync(new IdentityRole("ADMIN"));

        if (!await roleManager.RoleExistsAsync("USER"))
            await roleManager.CreateAsync(new IdentityRole("USER"));

        var adminEmail = "admin@blog.com";
        var adminPass = "Admin123!";

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new AppUser { UserName = adminEmail, Email = adminEmail };
            var created = await userManager.CreateAsync(admin, adminPass);
            if (!created.Succeeded) return;
        }

        if (!await userManager.IsInRoleAsync(admin, "ADMIN"))
            await userManager.AddToRoleAsync(admin, "ADMIN");

        if (!await userManager.IsInRoleAsync(admin, "USER"))
            await userManager.AddToRoleAsync(admin, "USER");
    }
}
