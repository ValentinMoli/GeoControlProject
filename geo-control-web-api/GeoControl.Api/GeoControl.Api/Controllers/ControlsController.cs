using GeoControl.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoControl.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ControlsController : ControllerBase
    {
        private readonly GeoControlDbContext _context;

        public ControlsController(GeoControlDbContext context)
        {
            _context = context;
        }

        // GET: api/controls
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Control>>> GetControls()
        {
            var controls = await _context.Controls
                .Include(c => c.Profession)
                .Include(c => c.AssignedUser)
                .AsNoTracking()
                .ToListAsync();

            controls.ForEach(c => c.AssignedUserName = c.AssignedUser?.FullName);

            return Ok(controls);
        }

    // POST: api/controls
    [HttpPost]
    [Authorize(Roles = "1")]
    public async Task<ActionResult<Control>> CreateControl([FromBody] CreateControlDto dto)
    {
      if (!ModelState.IsValid)
      {
        return BadRequest(ModelState);
      }

      var control = new Control
      {
        Title = dto.Title,
        Description = dto.Description,
        Latitude = dto.Latitude,
        Longitude = dto.Longitude,
        Address = dto.Address,
        ProfessionId = dto.ProfessionId,
        Status = "Pending",
        CreatedAt = DateTime.UtcNow,
        ExpiresAt = dto.ExpiresAt,
        AssignedUserId = dto.AssignedUserId
      };

      _context.Controls.Add(control);
      await _context.SaveChangesAsync();

      return CreatedAtAction(nameof(GetControls), new { id = control.Id }, control);
    }
        // PUT: api/controls/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "1")]
        public async Task<IActionResult> UpdateControl(int id, [FromBody] CreateControlDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var control = await _context.Controls.FindAsync(id);
            if (control == null)
            {
                return NotFound();
            }

            control.Title = dto.Title;
            control.Description = dto.Description;
            control.Latitude = dto.Latitude;
            control.Longitude = dto.Longitude;
            control.Address = dto.Address;
            control.ProfessionId = dto.ProfessionId;
            control.ExpiresAt = dto.ExpiresAt;
            control.AssignedUserId = dto.AssignedUserId;

            _context.Entry(control).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ControlExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // PUT: api/controls/{id}/complete
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteControl(int id)
        {
            var control = await _context.Controls.FindAsync(id);
            if (control == null)
            {
                return NotFound();
            }

            control.Status = "Completed";
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/controls/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "1")]
        public async Task<IActionResult> DeleteControl(int id)
        {
            var control = await _context.Controls.FindAsync(id);
            if (control == null)
            {
                return NotFound();
            }

            _context.Controls.Remove(control);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ControlExists(int id)
        {
            return _context.Controls.Any(e => e.Id == id);
        }
    }

    public class CreateControlDto
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Address { get; set; } = null!;
        public int ProfessionId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int AssignedUserId { get; set; }
    }
}
