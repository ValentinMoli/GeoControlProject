using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GeoControl.Api.Models
{
    public class Control
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        [Required]
        [StringLength(500)]
        public string Address { get; set; } = null!;

        public string? ImageBase64 { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = null!; // Pending, Completed, Expired

        public DateTime CreatedAt { get; set; }

        public DateTime ExpiresAt { get; set; }

        public int AssignedUserId { get; set; }
        
        public int ProfessionId { get; set; }

        [ForeignKey("AssignedUserId")]
        [JsonIgnore]
        public virtual User? AssignedUser { get; set; }

        [ForeignKey("ProfessionId")]
        public virtual Profession? Profession { get; set; }

        [NotMapped]
        public string? AssignedUserName { get; set; }
    }
}
