using UnityEngine;

public class FlickerLight : MonoBehaviour
{
    public float minIntensity = 0.5f;
    public float maxIntensity = 1.5f;
    public float flickerSpeed = 3f;

    private Light _light;

    private void Start()
    {
        _light = GetComponent<Light>();
    }

    private void Update()
    {
        if (_light == null) return;

        float noise = Mathf.PerlinNoise(Time.time * flickerSpeed, 0f);
        _light.intensity = Mathf.Lerp(minIntensity, maxIntensity, noise);
    }
}
