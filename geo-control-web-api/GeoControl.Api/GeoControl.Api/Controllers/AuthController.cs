using GeoControl.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;

namespace GeoControl.Api.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class AuthController : ControllerBase
  {
    private readonly GeoControlDbContext _context;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthController(
        GeoControlDbContext context,
        IConfiguration config,
        IHttpClientFactory httpClientFactory)
    {
      _context = context;
      _config = config;
      _httpClientFactory = httpClientFactory;
    }

    public class LoginRequest
    {
      public string Email { get; set; } = null!;
      public string Password { get; set; } = null!;
    }

    public class LoginResponse
    {
      public bool Success { get; set; }
      public string? Message { get; set; }
      public string? Token { get; set; }
      public bool Requires2FA { get; set; }
      public int? UserId { get; set; } // para que el front sepa qué user validar
    }

    public class Confirm2FARequest
    {
      public int UserId { get; set; }
      public string Code { get; set; } = null!;
    }

    private class TwoFactorValidateResponse
    {
      public bool Valid { get; set; }
      public string? Message { get; set; }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
      var user = await _context.Users
          .FirstOrDefaultAsync(u => u.Email == request.Email);

      if (user == null)
      {
        return Ok(new LoginResponse
        {
          Success = false,
          Message = "Usuario no encontrado."
        });
      }

      if (user.IsActive.HasValue && !user.IsActive.Value)
      {
        return Ok(new LoginResponse
        {
          Success = false,
          Message = "Usuario desactivado."
        });
      }

      if (user.Password != request.Password)
      {
        return Ok(new LoginResponse
        {
          Success = false,
          Message = "Contraseña incorrecta."
        });
      }

      // ADMIN -> dispara 2FA
      if (user.Role == 1)
      {
        // llamar a microservicio /generate
        var client = _httpClientFactory.CreateClient("TwoFactor");

        var generateBody = new
        {
          userId = user.Id,
          email = user.Email
        };

        try
        {
          var resp = await client.PostAsJsonAsync("/generate", generateBody);

          if (!resp.IsSuccessStatusCode)
          {
            return StatusCode(500, new LoginResponse
            {
              Success = false,
              Message = "No se pudo iniciar el proceso de 2FA."
            });
          }
        }
        catch (Exception)
        {
          return StatusCode(500, new LoginResponse
          {
            Success = false,
            Message = "Error comunicando con el servicio de 2FA."
          });
        }

        return Ok(new LoginResponse
        {
          Success = true,
          Requires2FA = true,
          UserId = user.Id,
          Message = "Se envió un código de verificación al teléfono registrado."
        });
      }

      // OPERARIO -> token directo
      var token = GenerateJwtToken(user);

      return Ok(new LoginResponse
      {
        Success = true,
        Requires2FA = false,
        Token = token,
        UserId = user.Id,
        Message = "Login exitoso."
      });
    }

    [HttpPost("confirm-2fa")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Confirm2FA([FromBody] Confirm2FARequest request)
    {
      var user = await _context.Users.FindAsync(request.UserId);
      if (user == null)
      {
        return Unauthorized(new LoginResponse
        {
          Success = false,
          Message = "Usuario no encontrado."
        });
      }

      if (user.Role != 1)
      {
        return BadRequest(new LoginResponse
        {
          Success = false,
          Message = "El usuario no requiere 2FA."
        });
      }

      var client = _httpClientFactory.CreateClient("TwoFactor");

      try
      {
        var validateBody = new
        {
          userId = request.UserId,
          code = request.Code
        };

        var resp = await client.PostAsJsonAsync("/validate", validateBody);

        if (!resp.IsSuccessStatusCode)
        {
          return Unauthorized(new LoginResponse
          {
            Success = false,
            Message = "Código inválido o expirado."
          });
        }

        var data = await resp.Content.ReadFromJsonAsync<TwoFactorValidateResponse>();
        if (data == null || !data.Valid)
        {
          return Unauthorized(new LoginResponse
          {
            Success = false,
            Message = data?.Message ?? "Código inválido."
          });
        }
      }
      catch (Exception)
      {
        return StatusCode(500, new LoginResponse
        {
          Success = false,
          Message = "Error comunicando con el servicio de 2FA."
        });
      }

      var token = GenerateJwtToken(user);

      return Ok(new LoginResponse
      {
        Success = true,
        Requires2FA = false,
        Token = token,
        UserId = user.Id,
        Message = "2FA validado. Login exitoso."
      });
    }

    private string GenerateJwtToken(User user)
    {
      var jwtSection = _config.GetSection("Jwt");
      var key = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
      var issuer = jwtSection["Issuer"];
      var audience = jwtSection["Audience"];

      var keyBytes = Encoding.UTF8.GetBytes(key);

      var claims = new List<Claim>
            {
                new Claim("userId", user.Id.ToString()),
                new Claim("username", user.Email),
                new Claim("role", user.Role.ToString()),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

      var creds = new SigningCredentials(
          new SymmetricSecurityKey(keyBytes),
          SecurityAlgorithms.HmacSha256);

      var token = new JwtSecurityToken(
          issuer: issuer,
          audience: audience,
          claims: claims,
          expires: DateTime.UtcNow.AddHours(4),
          signingCredentials: creds
      );

      return new JwtSecurityTokenHandler().WriteToken(token);
    }
  }
}
