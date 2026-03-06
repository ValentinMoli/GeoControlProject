using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace GeoControl.Api.Models
{

    public partial class User
    {
        public User()
        {
        }

        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Email { get; set; } = null!;
        
        [Required]
        [StringLength(200)]
        public string Password { get; set; } = null!;
        
        public int Role { get; set; }
        
        [StringLength(200)]
        public string FullName { get; set; } = null!;
        
        [StringLength(50)]
        public string? PhoneNumber { get; set; }
        
        public int? ProfessionId { get; set; }

        public bool? IsActive { get; set; }
        
        public DateTime CreatedAt { get; set; }
    }
}
