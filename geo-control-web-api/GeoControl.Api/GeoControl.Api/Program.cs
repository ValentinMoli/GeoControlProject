using GeoControl.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =======================
//  CONNECTION STRING
// =======================
var env = builder.Environment.EnvironmentName;
var connectionString = builder.Configuration.GetConnectionString(
    env == "Development" ? "LocalConnection" : "DockerConnection"
);

builder.Services.AddDbContext<GeoControlDbContext>(options =>
{
  options.UseSqlServer(connectionString);
});

Console.WriteLine($"USING CONNECTION STRING: {connectionString}");

// =======================
//  JWT CONFIG
// =======================
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.RequireHttpsMetadata = false;
  options.SaveToken = true;
  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = signingKey,
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidIssuer = jwtIssuer,
    ValidAudience = jwtAudience,
    ClockSkew = TimeSpan.Zero
  };
});

// =======================
//  CORS (Angular dev 4200)
// =======================
builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowAngularDev", policy =>
  {
    policy
      .WithOrigins("http://localhost:4200")
      .AllowAnyHeader()
      .AllowAnyMethod();
  });
});

// =======================
//  HTTP CLIENT 2FA
// =======================
builder.Services.AddHttpClient("TwoFactor", client =>
{
  var baseUrl = builder.Configuration["TwoFactor:BaseUrl"];
  if (!string.IsNullOrEmpty(baseUrl))
  {
    client.BaseAddress = new Uri(baseUrl);
  }
});

// =======================
//  MVC + SWAGGER
// =======================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Background Services
builder.Services.AddHostedService<GeoControl.Api.Services.ControlExpirationService>();

var app = builder.Build();

// =======================
//  PIPELINE HTTP
// =======================
if (app.Environment.IsDevelopment())
{
  app.UseSwagger();
  app.UseSwaggerUI();
}

// CORS antes de todo
app.UseCors("AllowAngularDev");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
