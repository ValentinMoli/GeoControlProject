using GeoControl.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoControl.Api.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  [Authorize(Roles = "1")]
  public class UsersController : ControllerBase
  {
    private readonly GeoControlDbContext _context;

    public UsersController(GeoControlDbContext context)
    {
      _context = context;
    }

    public class UserDto
    {
      public int Id { get; set; }
      public string? Email { get; set; }
      public int Role { get; set; }              
      public string FullName { get; set; } = null!;
      public bool IsActive { get; set; }        
      public DateTime CreatedAt { get; set; }
      public int? ProfessionId { get; set; }
      public string? ProfessionName { get; set; }
    }

    public class CreateUserRequest
    {
      public string Password { get; set; } = null!;
      public string Email { get; set; } = null!;
      public int Role { get; set; }
      public string FullName { get; set; } = null!;
      public int? ProfessionId { get; set; }
    }

    public class UpdateUserRequest
    {
      public string? Password { get; set; }
      public int Role { get; set; }
      public string FullName { get; set; } = null!;
      public string? Email { get; set; }
      public bool IsActive { get; set; }
      public int? ProfessionId { get; set; }
    }

    private static UserDto MapToDto(User u, string professionName) => new()
    {
      Id = u.Id,
      Email = u.Email,
      Role = u.Role,
      FullName = u.FullName,
      IsActive = u.IsActive ?? true,       
      CreatedAt = u.CreatedAt,
      ProfessionId = u.ProfessionId,
      ProfessionName = professionName
    };

    // GET: api/users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
      var users = await _context.Users.AsNoTracking()
          .GroupJoin(_context.Professions,
                u => u.ProfessionId,
                p => p.Id,
                (u, profs) => new { u, profs })
          .SelectMany(
                x => x.profs.DefaultIfEmpty(),
                (x, p) => new UserDto
                {
                    Id = x.u.Id,
                    Email = x.u.Email,
                    Role = x.u.Role,
                    FullName = x.u.FullName,
                    IsActive = x.u.IsActive ?? true,
                    CreatedAt = x.u.CreatedAt,
                    ProfessionId = x.u.ProfessionId,
                    ProfessionName = p != null ? p.Name : null
                })
          .ToListAsync();

      return Ok(users);
    }

    // GET: api/users/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
      var userDto = await _context.Users.AsNoTracking()
          .Where(u => u.Id == id)
          .GroupJoin(_context.Professions,
                u => u.ProfessionId,
                p => p.Id,
                (u, profs) => new { u, profs })
          .SelectMany(
                x => x.profs.DefaultIfEmpty(),
                (x, p) => new UserDto
                {
                    Id = x.u.Id,
                    Email = x.u.Email,
                    Role = x.u.Role,
                    FullName = x.u.FullName,
                    IsActive = x.u.IsActive ?? true,
                    CreatedAt = x.u.CreatedAt,
                    ProfessionId = x.u.ProfessionId,
                    ProfessionName = p != null ? p.Name : null
                })
          .FirstOrDefaultAsync();

      if (userDto == null)
        return NotFound();

      return Ok(userDto);
    }

    // POST: api/users
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
      var exists = await _context.Users.AnyAsync(u => u.Email == request.Email);
      if (exists)
        return Conflict("El email ya existe.");

      var user = new User
      {
        Email = request.Email,
        Password = request.Password,
        Role = request.Role,
        FullName = request.FullName,
        IsActive = true,
        CreatedAt = DateTime.UtcNow,
        ProfessionId = request.ProfessionId
      };

      _context.Users.Add(user);
      await _context.SaveChangesAsync();

      var professionName = user.ProfessionId.HasValue
          ? await _context.Professions
              .Where(p => p.Id == user.ProfessionId.Value)
              .Select(p => p.Name)
              .FirstOrDefaultAsync()
          : null;

      return CreatedAtAction(nameof(GetUser), new { id = user.Id }, MapToDto(user, professionName));
    }

    // PUT: api/users/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
      var user = await _context.Users.FindAsync(id);
      if (user == null)
        return NotFound();

      user.Role = request.Role;
      user.FullName = request.FullName;
      user.Email = request.Email;
      user.IsActive = request.IsActive;

      user.ProfessionId = request.ProfessionId;

      if (!string.IsNullOrWhiteSpace(request.Password))
        user.Password = request.Password;

      await _context.SaveChangesAsync();

      var professionName = user.ProfessionId.HasValue
          ? await _context.Professions
              .Where(p => p.Id == user.ProfessionId.Value)
              .Select(p => p.Name)
              .FirstOrDefaultAsync()
          : null;

      return Ok(MapToDto(user, professionName));
    }

    // DELETE: api/users/5  (BAJA LÓGICA)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
      var user = await _context.Users.FindAsync(id);
      if (user == null)
        return NotFound();

      user.IsActive = false;
      await _context.SaveChangesAsync();

      return NoContent();
    }

    // PUT: api/users/5/reactivate (ALTA LÓGICA)
    [HttpPut("{id:int}/reactivate")]
    public async Task<IActionResult> ReactivateUser(int id)
    {
      var user = await _context.Users.FindAsync(id);
      if (user == null)
        return NotFound();

      user.IsActive = true;
      await _context.SaveChangesAsync();

      return NoContent();
    }
  }
}
