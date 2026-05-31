using UnityEngine;

public class MuzzleFlashEffect : MonoBehaviour
{
    private GameObject[] _flashSpheres;
    private GameObject[] _smokeCubes;
    private float _flashTimer;
    private float _smokeTimer;
    private bool _flashing;
    private bool _smoking;

    private void Awake()
    {
        // Pre-create flash spheres (hidden by default)
        _flashSpheres = new GameObject[4];
        Color[] flashColors = new Color[]
        {
            new Color(1f, 0.95f, 0.3f),   // bright yellow
            new Color(1f, 0.7f, 0.1f),    // orange
            new Color(1f, 0.85f, 0.2f),   // yellow-orange
            new Color(1f, 0.6f, 0.05f)    // deep orange
        };

        for (int i = 0; i < _flashSpheres.Length; i++)
        {
            GameObject sphere = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            sphere.transform.parent = transform;
            float scale = Random.Range(0.05f, 0.15f);
            sphere.transform.localScale = new Vector3(scale, scale, scale);
            sphere.transform.localPosition = new Vector3(
                Random.Range(-0.03f, 0.03f),
                Random.Range(-0.03f, 0.03f),
                Random.Range(-0.02f, 0.02f)
            );

            // Remove collider
            Collider col = sphere.GetComponent<Collider>();
            if (col != null) Destroy(col);

            // Apply emissive material
            Renderer rend = sphere.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                mat.SetColor("_BaseColor", flashColors[i]);
                mat.SetColor("_EmissionColor", flashColors[i] * 3f);
                mat.EnableKeyword("_EMISSION");
                rend.material = mat;
            }

            sphere.SetActive(false);
            _flashSpheres[i] = sphere;
        }
    }

    public void Flash()
    {
        // Enable flash spheres with randomized scales
        for (int i = 0; i < _flashSpheres.Length; i++)
        {
            if (_flashSpheres[i] == null) continue;
            float scale = Random.Range(0.05f, 0.15f);
            _flashSpheres[i].transform.localScale = new Vector3(scale, scale, scale);
            _flashSpheres[i].transform.localPosition = new Vector3(
                Random.Range(-0.03f, 0.03f),
                Random.Range(-0.03f, 0.03f),
                Random.Range(-0.02f, 0.02f)
            );
            _flashSpheres[i].SetActive(true);
        }

        _flashing = true;
        _flashTimer = 0f;

        // Spawn smoke cubes
        _smokeCubes = new GameObject[3];
        for (int i = 0; i < _smokeCubes.Length; i++)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.position = transform.position + new Vector3(
                Random.Range(-0.02f, 0.02f),
                0.02f,
                Random.Range(-0.02f, 0.02f)
            );
            float scale = Random.Range(0.02f, 0.04f);
            cube.transform.localScale = new Vector3(scale, scale, scale);

            // Remove collider
            Collider col = cube.GetComponent<Collider>();
            if (col != null) Destroy(col);

            // Gray smoke material
            Renderer rend = cube.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
                mat.SetColor("_BaseColor", new Color(0.5f, 0.5f, 0.5f, 0.6f));
                mat.SetFloat("_Surface", 1f);
                mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
                mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
                mat.SetInt("_ZWrite", 0);
                mat.renderQueue = 3000;
                mat.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
                rend.material = mat;
            }

            _smokeCubes[i] = cube;
        }

        _smoking = true;
        _smokeTimer = 0f;
    }

    private void Update()
    {
        if (_flashing)
        {
            _flashTimer += Time.deltaTime;
            if (_flashTimer >= 0.06f)
            {
                for (int i = 0; i < _flashSpheres.Length; i++)
                {
                    if (_flashSpheres[i] != null)
                        _flashSpheres[i].SetActive(false);
                }
                _flashing = false;
            }
        }

        if (_smoking)
        {
            _smokeTimer += Time.deltaTime;
            if (_smokeCubes != null)
            {
                for (int i = 0; i < _smokeCubes.Length; i++)
                {
                    if (_smokeCubes[i] != null)
                    {
                        Vector3 pos = _smokeCubes[i].transform.position;
                        pos.y += 0.5f * Time.deltaTime;
                        _smokeCubes[i].transform.position = pos;
                    }
                }
            }

            if (_smokeTimer >= 0.3f)
            {
                for (int i = 0; i < _smokeCubes.Length; i++)
                {
                    if (_smokeCubes[i] != null)
                        Destroy(_smokeCubes[i]);
                }
                _smoking = false;
            }
        }
    }
}
