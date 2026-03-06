using GeoControl.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoControl.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfessionsController : ControllerBase
    {
        private readonly GeoControlDbContext _context;

        public ProfessionsController(GeoControlDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Profession>>> GetProfessions()
        {
            return await _context.Professions.ToListAsync();
        }

        [HttpPost]
        [Authorize(Roles = "1")]
        public async Task<ActionResult<Profession>> CreateProfession([FromBody] ProfessionDto dto)
        {
            var profession = new Profession { Name = dto.Name };
            _context.Professions.Add(profession);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProfessions), new { id = profession.Id }, profession);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "1")]
        public async Task<IActionResult> UpdateProfession(int id, [FromBody] ProfessionDto dto)
        {
            var profession = await _context.Professions.FindAsync(id);
            if (profession == null) return NotFound();

            profession.Name = dto.Name;
            await _context.SaveChangesAsync();
            return Ok(profession);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "1")]
        public async Task<IActionResult> DeleteProfession(int id)
        {
            var profession = await _context.Professions.FindAsync(id);
            if (profession == null) return NotFound();

            var usedByUsers = await _context.Users.AnyAsync(u => u.ProfessionId == id);
            var usedByControls = await _context.Controls.AnyAsync(c => c.ProfessionId == id);

            if (usedByUsers || usedByControls)
                return Conflict(new { message = "Esta profesión está en uso por usuarios o controles existentes." });

            _context.Professions.Remove(profession);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class ProfessionDto
    {
        public string Name { get; set; } = null!;
    }
}
