using UnityEngine;

public class DustParticles : MonoBehaviour
{
    public int particleCount = 30;
    public float spawnRadius = 3f;
    public float riseSpeed = 0.2f;
    public float lifetime = 8f;

    private Transform[] _particles;
    private float[] _startY;

    private void Start()
    {
        _particles = new Transform[particleCount];
        _startY = new float[particleCount];

        for (int i = 0; i < particleCount; i++)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            float scale = Random.Range(0.02f, 0.04f);
            cube.transform.localScale = new Vector3(scale, scale, scale);

            Vector3 randomOffset = new Vector3(
                Random.Range(-spawnRadius, spawnRadius),
                Random.Range(-spawnRadius, spawnRadius),
                Random.Range(-spawnRadius, spawnRadius)
            );
            cube.transform.position = transform.position + randomOffset;
            cube.transform.parent = transform;

            // Remove collider
            Collider col = cube.GetComponent<Collider>();
            if (col != null) Destroy(col);

            // Apply semi-transparent material
            Renderer rend = cube.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                Color dustColor = new Color(0.85f, 0.85f, 0.85f, 0.4f);
                mat.SetFloat("_Surface", 1f); // Transparent
                mat.SetFloat("_Blend", 0f);   // Alpha blend
                mat.SetColor("_BaseColor", dustColor);
                mat.SetFloat("_AlphaClip", 0f);
                mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
                mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                mat.SetInt("_ZWrite", 0);
                mat.renderQueue = 3000;
                mat.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
                rend.material = mat;
            }

            _particles[i] = cube.transform;
            _startY[i] = cube.transform.position.y;
        }
    }

    private void Update()
    {
        if (_particles == null) return;

        for (int i = 0; i < _particles.Length; i++)
        {
            if (_particles[i] == null) continue;

            Vector3 pos = _particles[i].position;
            pos.y += riseSpeed * Time.deltaTime;
            _particles[i].position = pos;

            // Reset to bottom when exceeding lifetime distance
            if (pos.y - _startY[i] >= lifetime * riseSpeed)
            {
                pos.y = _startY[i];
                pos.x = transform.position.x + Random.Range(-spawnRadius, spawnRadius);
                pos.z = transform.position.z + Random.Range(-spawnRadius, spawnRadius);
                _particles[i].position = pos;
            }
        }
    }
}
