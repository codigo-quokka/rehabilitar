using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixActividadReservaRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservas_Actividades_ActividadId",
                table: "Reservas");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservas_Actividades_ActividadId",
                table: "Reservas",
                column: "ActividadId",
                principalTable: "Actividades",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reservas_Actividades_ActividadId",
                table: "Reservas");

            migrationBuilder.AddForeignKey(
                name: "FK_Reservas_Actividades_ActividadId",
                table: "Reservas",
                column: "ActividadId",
                principalTable: "Actividades",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
