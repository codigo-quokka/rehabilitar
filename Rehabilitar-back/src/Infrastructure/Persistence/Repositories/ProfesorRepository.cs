using Infrastructure.Persistence.Repositories;
using Domain.Profesores;
using Infrastructure.Persistence;
using Application.Profesores;

namespace Infrastructure.Profesores;

public class ProfesorRepository : RepositoryBase<Profesor>, IProfesorRepository
{
    public ProfesorRepository(RehabilitarDbContext context) : base(context) { }
}
