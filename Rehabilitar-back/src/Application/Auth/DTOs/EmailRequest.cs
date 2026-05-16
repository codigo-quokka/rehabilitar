namespace Application.Auth.DTOs;

// es un record sólo con un email, le pongo este nombre porque lo uso para varias cosas.
public record class EmailRequest(string Email);