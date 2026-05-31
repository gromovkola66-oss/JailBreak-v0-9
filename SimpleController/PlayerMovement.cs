using UnityEngine;

/// <summary>
/// Контроллер персонажа. Движение WASD + мышь + прыжок.
/// Как использовать:
/// 1. Создай Capsule (GameObject > 3D Object > Capsule)
/// 2. Добавь компонент CharacterController (Add Component > CharacterController)
/// 3. Повесь этот скрипт на капсулу
/// 4. Перетащи Main Camera ВНУТРЬ капсулы (сделай дочерним)
/// 5. Подними камеру: позиция Y = 0.5
/// 6. Нажми Play
/// </summary>
public class PlayerMovement : MonoBehaviour
{
    // Скорость движения
    public float walkSpeed = 5f;

    // Сила прыжка
    public float jumpSpeed = 7f;

    // Гравитация
    public float gravity = 15f;

    // Скорость поворота мышью
    public float mouseSensitivity = 2f;

    private CharacterController cc;
    private float ySpeed = 0f;
    private float cameraPitch = 0f;
    private Transform cam;

    void Start()
    {
        // Берём CharacterController
        cc = GetComponent<CharacterController>();
        if (cc == null)
        {
            cc = gameObject.AddComponent<CharacterController>();
            cc.height = 2f;
            cc.radius = 0.5f;
        }

        // Находим камеру
        cam = Camera.main.transform;

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
        if (cam != null)
        {
            cam.localEulerAngles = new Vector3(cameraPitch, 0f, 0f);
        }

        // --- ДВИЖЕНИЕ WASD ---
        float moveX = Input.GetAxis("Horizontal"); // A и D
        float moveZ = Input.GetAxis("Vertical");   // W и S

        Vector3 move = transform.right * moveX + transform.forward * moveZ;
        move = move.normalized * walkSpeed;

        // --- ПРЫЖОК И ГРАВИТАЦИЯ ---
        if (cc.isGrounded)
        {
            ySpeed = -1f; // Держим на земле

            if (Input.GetKeyDown(KeyCode.Space))
            {
                ySpeed = jumpSpeed;
            }
        }
        else
        {
            ySpeed -= gravity * Time.deltaTime;
        }

        move.y = ySpeed;

        // --- ПРИМЕНЯЕМ ДВИЖЕНИЕ ---
        cc.Move(move * Time.deltaTime);
    }
}
