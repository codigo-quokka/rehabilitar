using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeAptoFisicoOneToOne : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AptosFisicos_ClienteId",
                table: "AptosFisicos");

            migrationBuilder.CreateIndex(
                name: "IX_AptosFisicos_ClienteId",
                table: "AptosFisicos",
                column: "ClienteId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AptosFisicos_ClienteId",
                table: "AptosFisicos");

            migrationBuilder.CreateIndex(
                name: "IX_AptosFisicos_ClienteId",
                table: "AptosFisicos",
                column: "ClienteId");
        }
    }
}
