using GeoControl.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GeoControl.Api.Services
{
    public class ControlExpirationService : BackgroundService
    {
        private readonly ILogger<ControlExpirationService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public ControlExpirationService(ILogger<ControlExpirationService> logger, IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ControlExpirationService successfully started.");

            // Se ejecutará de forma indefinida hasta que la aplicación se apague
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndExpireControlsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while checking for expired controls.");
                }

                // Esperar 1 minuto antes de volver a verificar
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task CheckAndExpireControlsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GeoControlDbContext>();
            
            var now = DateTime.UtcNow;

            // Buscar controles Pendientes que ya hayan superado su fecha de vencimiento
            var expiredControls = await context.Controls
                .Where(c => c.Status == "Pending" && c.ExpiresAt <= now)
                .ToListAsync();

            if (expiredControls.Any())
            {
                foreach (var control in expiredControls)
                {
                    control.Status = "Expired";
                    _logger.LogInformation($"Control ID {control.Id} ha sido marcado como vencido automáticamente.");
                }

                await context.SaveChangesAsync();
                _logger.LogInformation($"✅ {expiredControls.Count} controles han sido actualizados al estado 'Expired'.");
            }
        }
    }
}
