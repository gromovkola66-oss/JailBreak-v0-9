using UnityEngine;

/// <summary>
/// Основной контроллер игрока. Управляет движением персонажа (WASD),
/// интегрирует системы телепортации и спринта.
/// </summary>
[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Движение")]
    [SerializeField] private float walkSpeed = 5f;
    [SerializeField] private float gravity = -20f;
    [SerializeField] private float groundCheckDistance = 0.2f;
    [SerializeField] private LayerMask groundMask;

    [Header("Компоненты")]
    [SerializeField] private TeleportAbility teleportAbility;
    [SerializeField] private SprintAbility sprintAbility;

    private CharacterController characterController;
    private Vector3 velocity;
    private bool isGrounded;

    /// <summary>
    /// Текущая скорость передвижения (может изменяться спринтом).
    /// </summary>
    public float CurrentMoveSpeed { get; private set; }

    /// <summary>
    /// Направление движения игрока в мировых координатах.
    /// </summary>
    public Vector3 MoveDirection { get; private set; }

    /// <summary>
    /// Находится ли игрок на земле.
    /// </summary>
    public bool IsGrounded => isGrounded;

    private void Awake()
    {
        characterController = GetComponent<CharacterController>();

        if (teleportAbility == null)
            teleportAbility = GetComponent<TeleportAbility>();

        if (sprintAbility == null)
            sprintAbility = GetComponent<SprintAbility>();
    }

    private void Update()
    {
        CheckGround();
        HandleMovement();
        ApplyGravity();
    }

    /// <summary>
    /// Проверяет, находится ли персонаж на земле.
    /// </summary>
    private void CheckGround()
    {
        isGrounded = characterController.isGrounded;

        if (isGrounded && velocity.y < 0f)
        {
            velocity.y = -2f;
        }
    }

    /// <summary>
    /// Обрабатывает ввод движения WASD и применяет перемещение.
    /// </summary>
    private void HandleMovement()
    {
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");

        Vector3 direction = new Vector3(horizontal, 0f, vertical).normalized;

        // Определяем текущую скорость с учётом спринта
        float speedMultiplier = 1f;
        if (sprintAbility != null && sprintAbility.IsSprinting)
        {
            speedMultiplier = sprintAbility.SpeedMultiplier;
        }

        CurrentMoveSpeed = walkSpeed * speedMultiplier;
        MoveDirection = direction;

        if (direction.magnitude >= 0.1f)
        {
            // Поворот персонажа в направлении движения
            float targetAngle = Mathf.Atan2(direction.x, direction.z) * Mathf.Rad2Deg;
            transform.rotation = Quaternion.Slerp(
                transform.rotation,
                Quaternion.Euler(0f, targetAngle, 0f),
                Time.deltaTime * 10f
            );

            Vector3 moveDir = direction * CurrentMoveSpeed;
            characterController.Move(moveDir * Time.deltaTime);
        }
    }

    /// <summary>
    /// Применяет гравитацию к персонажу.
    /// </summary>
    private void ApplyGravity()
    {
        velocity.y += gravity * Time.deltaTime;
        characterController.Move(velocity * Time.deltaTime);
    }

    /// <summary>
    /// Телепортирует персонажа в указанную позицию.
    /// Используется системой телепортации.
    /// </summary>
    /// <param name="position">Целевая позиция телепортации.</param>
    public void TeleportTo(Vector3 position)
    {
        characterController.enabled = false;
        transform.position = position;
        characterController.enabled = true;
        velocity = Vector3.zero;
    }
}
