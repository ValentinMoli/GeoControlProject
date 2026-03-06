using System.ComponentModel.DataAnnotations;

namespace GeoControl.Api.Models
{
    public class Profession
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;
    }
}
