using UnityEngine;

public static class BulletImpact
{
    public static void SpawnImpact(Vector3 position, Vector3 normal)
    {
        for (int i = 0; i < 6; i++)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.position = position;
            cube.transform.localScale = new Vector3(0.03f, 0.03f, 0.03f);

            // Remove collider
            Collider col = cube.GetComponent<Collider>();
            if (col != null) Object.Destroy(col);

            // Apply yellow material
            Renderer rend = cube.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = CreateMaterial(new Color(1f, 0.9f, 0.2f));
                rend.material = mat;
            }

            // Add movement behaviour
            ImpactParticle particle = cube.AddComponent<ImpactParticle>();
            Vector3 randomDir = (normal + Random.insideUnitSphere).normalized;
            particle.velocity = randomDir * Random.Range(2f, 5f);
        }
    }

    public static void SpawnBloodEffect(Vector3 position)
    {
        for (int i = 0; i < 4; i++)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.transform.position = position;
            cube.transform.localScale = new Vector3(0.03f, 0.03f, 0.03f);

            // Remove collider
            Collider col = cube.GetComponent<Collider>();
            if (col != null) Object.Destroy(col);

            // Apply red material
            Renderer rend = cube.GetComponent<Renderer>();
            if (rend != null)
            {
                Material mat = CreateMaterial(new Color(0.7f, 0.05f, 0.05f));
                rend.material = mat;
            }

            // Add movement behaviour
            ImpactParticle particle = cube.AddComponent<ImpactParticle>();
            Vector3 randomDir = Random.insideUnitSphere.normalized;
            particle.velocity = randomDir * Random.Range(1.5f, 3f);
        }
    }

    private static Material CreateMaterial(Color color)
    {
        Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.SetColor("_BaseColor", color);
        return mat;
    }
}

public class ImpactParticle : MonoBehaviour
{
    public Vector3 velocity;
    private float _timer;

    private void Start()
    {
        _timer = 0f;
    }

    private void Update()
    {
        _timer += Time.deltaTime;
        transform.position += velocity * Time.deltaTime;
        velocity += Physics.gravity * Time.deltaTime;

        if (_timer >= 0.4f)
        {
            Destroy(gameObject);
        }
    }
}
