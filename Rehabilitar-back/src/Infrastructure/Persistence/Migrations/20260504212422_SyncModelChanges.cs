using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ActividadId",
                table: "Reservas",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "EstadoDeReserva",
                table: "Reservas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "EstadoDelPago",
                table: "Reservas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "MontoPendiente",
                table: "Reservas",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActividadId",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "EstadoDeReserva",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "EstadoDelPago",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "MontoPendiente",
                table: "Reservas");
        }
    }
}
