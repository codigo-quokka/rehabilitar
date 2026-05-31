using Application.Clientes;
using Application.Common.Interfaces;
using Application.Profesores;
using Application.Usuarios.Requests;
using Application.Usuarios.Responses;
using Domain;
using Domain.Profesores;
using ErrorOr;
using Microsoft.AspNetCore.Identity;

namespace Application.Usuarios;

public class UsuarioService : IUsuarioService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IProfesorRepository _profesorRepo;
    private readonly IUnitOfWork _uow;
    private readonly IEmailService _emailService;

    // private readonly RehabilitarDbContext _dbContext;

    public UsuarioService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        IUsuarioRepository usuarioRepo,
        IClienteRepository clienteRepo,
        IProfesorRepository profesorRepo,
        IUnitOfWork uow,
        IEmailService emailService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _usuarioRepo = usuarioRepo;
        _clienteRepo = clienteRepo;
        _profesorRepo = profesorRepo;
        _uow = uow;
        _emailService = emailService;
    }

    public async Task<IEnumerable<UsuarioResponse>> GetAllAsync()
    {
        var users = await _usuarioRepo.GetAllAsync();
        var result = new List<UsuarioResponse>();

        foreach (var user in users)
        {
            var response = await MapToResponse(user);
            result.Add(response);
        }

        return result;
    }

    public async Task<UsuarioResponse?> GetByIdAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return null;

        return await MapToResponse(user);
    }

    public async Task<ErrorOr<UsuarioResponse>> CreateAsync(CrearUsuarioRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) != null)
        {
            return Error.Conflict("Usuario.EmailExistente", "Ya existe un usuario registrado con el email ingresado.");
        }

        var user = User.Create(request.Nombre, request.Apellido, request.Email, request.Dni, request.FechaNacimiento);

        if (await _usuarioRepo.ExistsByDniAndRoleAsync(request.Dni, request.Rol))
        {
            return Error.Conflict("Usuario.DniExistenteEnRol", 
                $"El DNI '{request.Dni}' ya se encuentra registrado con el rol '{request.Rol}'.");
        }

        var password = GenerateRandomPassword();
        var result = await _userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            return Error.Validation("Usuario.CreacionFallida", string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        if (!await _roleManager.RoleExistsAsync(request.Rol))
        {
            await _roleManager.CreateAsync(new Role(request.Rol));
        }

        await _userManager.AddToRoleAsync(user, request.Rol);


        if (request.Rol == "Profesor" && !string.IsNullOrEmpty(request.Especialidad))
        {
            var especialidad = Enum.Parse<TipoEspecialidad>(request.Especialidad);
            var profesor = Profesor.Create(user.Id, especialidad);
            _profesorRepo.Add(profesor);
            await _uow.SaveChangesAsync();
        }

        var emailResult = await EnviarMailConCredenciales(user, password);

        if (!emailResult.IsError)
        {
            // si el mail se envía correctamente le confirmamos el email directamente para que no tenga que verificarlo.
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            await _userManager.ConfirmEmailAsync(user, token);
        }
        // else / try/catch
        // implementar rollback.

        return await MapToResponse(user);
    }

    public async Task<ErrorOr<UsuarioResponse>> UpdateAsync(Guid id, EditarUsuarioRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return Error.NotFound("Usuario.NoEncontrado", "Usuario no encontrado.");

        user.UpdateInfo(
            request.Nombre ?? user.FirstName,
            request.Apellido ?? user.LastName,
            request.Email ?? user.Email!
        );

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return Error.Validation("Usuario.ActualizacionFallida", string.Join(", ", updateResult.Errors.Select(e => e.Description)));
        }

        if (!string.IsNullOrEmpty(request.Rol))
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            if (!await _roleManager.RoleExistsAsync(request.Rol))
            {
                await _roleManager.CreateAsync(new Role(request.Rol));
            }

            await _userManager.AddToRoleAsync(user, request.Rol);
        }

        if (!string.IsNullOrEmpty(request.Especialidad))
        {
            var profesor = await _profesorRepo.GetByIdAsync(user.Id);

            var especialidad = Enum.Parse<TipoEspecialidad>(request.Especialidad);

            if (profesor != null)
            {
                profesor.CambiarEspecialidad(especialidad);
            }
            else if (request.Rol == "Profesor")
            {
                profesor = Profesor.Create(user.Id, especialidad);
                _profesorRepo.Add(profesor);
            }

            await _uow.SaveChangesAsync();
        }

        return await MapToResponse(user);
    }

    public async Task<ErrorOr<Success>> DeleteAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return Error.NotFound("Usuario.NoEncontrado", "Usuario no encontrado.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return Error.Validation("Usuario.EliminacionFallida", string.Join(", ", result.Errors.Select(e => e.Description)));
        }
        
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> SuspenderAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return Error.NotFound("Usuario.NoEncontrado", "Usuario no encontrado.");

        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ReactivarAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return Error.NotFound("Usuario.NoEncontrado", "Usuario no encontrado.");

        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.SetLockoutEnabledAsync(user, false);
        
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> SolicitarReactivacionAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null)
            return Error.NotFound("Usuario.NoEncontrado", "Usuario no encontrado.");

        user.SolicitarReactivacion();
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return Error.Validation("Usuario.SolicitudReactivacionFallida", string.Join(", ", result.Errors.Select(e => e.Description)));
        }
        
        return Result.Success;
    }

    private async Task<UsuarioResponse> MapToResponse(User user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var rol = roles.FirstOrDefault() ?? "Cliente Registrado";

        var cliente = await _clienteRepo.GetByIdAsync(user.Id);
        // _dbContext.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == user.Id);

        var profesor = await _profesorRepo.GetByIdAsync(user.Id);
        // _dbContext.Profesores.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == user.Id);

        return new UsuarioResponse
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            Nombre = user.FirstName,
            Apellido = user.LastName,
            Rol = rol,
            Activo = !(user.LockoutEnabled && user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow),
            FechaAlta = DateTime.UtcNow,
            Telefono = user?.PhoneNumber,
            FechaNacimiento = user?.FechaNacimiento.ToString("yyyy-MM-dd"),
            Documento = user?.Dni.Valor,
            AptitudFisica = cliente?.AptoFisicoAprobado ?? null,
            RehabiliCoins = cliente?.RehabiliCoins ?? null,
            SaldoAFavor = cliente?.SaldoAFavor ?? null,
            CancelacionesConsecutivas = cliente?.CancelacionesConsecutivas ?? null,
            Especialidad = profesor?.Especialidad.ToString(),
        };
    }

    private static string GenerateRandomPassword()
    {
        const string lower = "abcdefghijklmnopqrstuvwxyz";
        const string upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string number = "0123456789";
        const string symbol = "!@#$%^&*()_-+=[{]};:<>|./?";
        const string allChars = lower + upper + number + symbol;

        var random = new Random();
        var passwordChars = new char[8];

        passwordChars[0] = lower[random.Next(lower.Length)];
        passwordChars[1] = upper[random.Next(upper.Length)];
        passwordChars[2] = number[random.Next(number.Length)];
        passwordChars[3] = symbol[random.Next(symbol.Length)];

        for (int i = 4; i < passwordChars.Length; i++)
        {
            passwordChars[i] = allChars[random.Next(allChars.Length)];
        }

        for (int i = passwordChars.Length - 1; i > 0; i--)
        {
            int j = random.Next(i + 1);
            (passwordChars[i], passwordChars[j]) = (passwordChars[j], passwordChars[i]);
        }

        return new string(passwordChars);
    }

    private async Task<ErrorOr<Success>> EnviarMailConCredenciales(User user, string password)
    {
        var emailResult = await _emailService.SendNewUserWithCredentialsEmail(user.Email!, password);

        return emailResult;
    }
}
