using UnityEngine;

/// <summary>
/// Контроллер персонажа на Rigidbody. Движение WASD + мышь + прыжок.
/// 
/// Как использовать:
/// 1. Создай Capsule (GameObject > 3D Object > Capsule)
/// 2. Повесь этот скрипт на капсулу (Rigidbody добавится сам)
/// 3. Перетащи Main Camera ВНУТРЬ капсулы (сделай дочерним)
/// 4. Подними камеру: позиция Y = 0.5
/// 5. Создай Plane под капсулой (земля)
/// 6. Капсулу поставь на Y = 1.5
/// 7. Нажми Play, кликни по Game окну
/// </summary>
[RequireComponent(typeof(Rigidbody))]
[RequireComponent(typeof(CapsuleCollider))]
public class PlayerMovement : MonoBehaviour
{
    // Скорость движения
    public float walkSpeed = 5f;

    // Сила прыжка
    public float jumpForce = 6f;

    // Скорость поворота мышью
    public float mouseSensitivity = 2f;

    private Rigidbody rb;
    private float cameraPitch = 0f;
    private bool isGrounded = false;

    void Start()
    {
        // Настраиваем Rigidbody
        rb = GetComponent<Rigidbody>();
        rb.freezeRotation = true; // Чтобы капсула не падала на бок
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;

        // Прячем курсор
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void Update()
    {
        // --- ПОВОРОТ МЫШЬЮ ---
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        // Поворот тела влево-вправо
        transform.Rotate(0f, mouseX, 0f);

        // Наклон камеры вверх-вниз
        cameraPitch -= mouseY;
        cameraPitch = Mathf.Clamp(cameraPitch, -85f, 85f);

        Transform cam = Camera.main.transform;
        if (cam != null)
        {
            cam.localEulerAngles = new Vector3(cameraPitch, 0f, 0f);
        }

        // --- ПРЫЖОК ---
        if (Input.GetKeyDown(KeyCode.Space) && isGrounded)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
            isGrounded = false;
        }
    }

    void FixedUpdate()
    {
        // --- ДВИЖЕНИЕ WASD ---
        float moveX = Input.GetAxis("Horizontal"); // A и D
        float moveZ = Input.GetAxis("Vertical");   // W и S

        Vector3 move = transform.right * moveX + transform.forward * moveZ;
        move = move.normalized * walkSpeed;

        // Сохраняем вертикальную скорость (гравитация от Rigidbody)
        Vector3 velocity = rb.linearVelocity;
        velocity.x = move.x;
        velocity.z = move.z;
        rb.linearVelocity = velocity;
    }

    // Проверка земли через коллизии
    void OnCollisionStay(Collision collision)
    {
        // Если касаемся чего-то снизу - мы на земле
        foreach (ContactPoint contact in collision.contacts)
        {
            if (contact.normal.y > 0.5f)
            {
                isGrounded = true;
                return;
            }
        }
    }

    void OnCollisionExit(Collision collision)
    {
        isGrounded = false;
    }
}
