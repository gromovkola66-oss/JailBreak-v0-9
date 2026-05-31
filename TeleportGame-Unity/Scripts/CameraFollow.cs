using UnityEngine;

/// <summary>
/// Камера третьего лица, следящая за игроком.
/// Поддерживает плавное слежение и изменение FOV при спринте.
/// </summary>
public class CameraFollow : MonoBehaviour
{
    [Header("Слежение за целью")]
    [SerializeField] private Transform target;
    [SerializeField] private Vector3 offset = new Vector3(0f, 8f, -6f);
    [SerializeField] private float smoothSpeed = 5f;

    [Header("Настройки камеры")]
    [SerializeField] private float normalFOV = 60f;
    [SerializeField] private float sprintFOV = 75f;
    [SerializeField] private float fovLerpSpeed = 3f;

    [Header("Вращение")]
    [SerializeField] private Vector3 lookAtOffset = new Vector3(0f, 1f, 0f);

    private Camera cam;
    private SprintAbility sprintAbility;
    private float targetFOV;

    private void Awake()
    {
        cam = GetComponent<Camera>();
        if (cam == null)
            cam = gameObject.AddComponent<Camera>();

        targetFOV = normalFOV;
    }

    private void Start()
    {
        if (target == null)
        {
            PlayerController player = FindObjectOfType<PlayerController>();
            if (player != null)
            {
                target = player.transform;
                sprintAbility = player.GetComponent<SprintAbility>();
            }
        }
        else
        {
            sprintAbility = target.GetComponent<SprintAbility>();
        }
    }

    private void LateUpdate()
    {
        if (target == null) return;

        FollowTarget();
        UpdateFOV();
    }

    /// <summary>
    /// Плавно перемещает камеру к целевой позиции.
    /// </summary>
    private void FollowTarget()
    {
        Vector3 desiredPosition = target.position + offset;
        Vector3 smoothedPosition = Vector3.Lerp(
            transform.position,
            desiredPosition,
            smoothSpeed * Time.deltaTime
        );

        transform.position = smoothedPosition;
        transform.LookAt(target.position + lookAtOffset);
    }

    /// <summary>
    /// Обновляет FOV камеры в зависимости от состояния спринта.
    /// </summary>
    private void UpdateFOV()
    {
        if (sprintAbility != null)
        {
            targetFOV = sprintAbility.IsSprinting ? sprintFOV : normalFOV;
        }

        if (cam != null)
        {
            cam.fieldOfView = Mathf.Lerp(cam.fieldOfView, targetFOV, fovLerpSpeed * Time.deltaTime);
        }
    }

    /// <summary>
    /// Устанавливает цель слежения камеры.
    /// </summary>
    /// <param name="newTarget">Новая цель.</param>
    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
        if (target != null)
            sprintAbility = target.GetComponent<SprintAbility>();
    }
}
