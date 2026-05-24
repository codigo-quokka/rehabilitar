namespace Application.Common.Settings;

public class FrontendSettings
{
    public string BaseUrl { get; }

    public FrontendSettings(string baseUrl)
    {
        BaseUrl = baseUrl;
    }
}
