using UnityEngine;

// Простой контроллер персонажа от первого лица
// Инструкция: создай Capsule, повесь этот скрипт, сделай камеру дочерней
[RequireComponent(typeof(CharacterController))]
public class SimplePlayerController : MonoBehaviour
{
    // Скорость ходьбы
    public float speed = 6f;

    // Высота прыжка
    public float jumpForce = 8f;

    // Гравитация
    public float gravityValue = 20f;

    // Чувствительность мыши
    public float lookSpeed = 2f;

    // Ограничение вертикального обзора
    public float lookXLimit = 80f;

    private CharacterController controller;
    private Vector3 moveDirection = Vector3.zero;
    private float rotationX = 0f;
    private Camera playerCamera;

    void Start()
    {
        // Получаем компоненты
        controller = GetComponent<CharacterController>();

        // Ищем камеру среди дочерних объектов, если нет - берём главную
        playerCamera = GetComponentInChildren<Camera>();
        if (playerCamera == null)
        {
            playerCamera = Camera.main;
        }

        // Прячем курсор
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void Update()
    {
        // === ДВИЖЕНИЕ ===

        // Запоминаем вертикальную скорость
        float verticalSpeed = moveDirection.y;

        // Берём направление от игрока
        Vector3 forward = transform.forward;
        Vector3 right = transform.right;

        // Читаем клавиши WASD
        float inputVertical = Input.GetAxis("Vertical");
        float inputHorizontal = Input.GetAxis("Horizontal");

        // Считаем направление движения
        moveDirection = (forward * inputVertical + right * inputHorizontal) * speed;

        // Прыжок
        if (controller.isGrounded)
        {
            if (Input.GetKeyDown(KeyCode.Space))
            {
                moveDirection.y = jumpForce;
            }
            else
            {
                moveDirection.y = -1f; // Прижимаем к земле
            }
        }
        else
        {
            // В воздухе - применяем гравитацию
            moveDirection.y = verticalSpeed - (gravityValue * Time.deltaTime);
        }

        // Двигаем персонажа
        controller.Move(moveDirection * Time.deltaTime);

        // === ОБЗОР МЫШЬЮ ===

        // Горизонтальный поворот - вращаем весь объект
        float mouseX = Input.GetAxis("Mouse X") * lookSpeed;
        transform.Rotate(0f, mouseX, 0f);

        // Вертикальный поворот - только камера
        if (playerCamera != null)
        {
            rotationX -= Input.GetAxis("Mouse Y") * lookSpeed;
            rotationX = Mathf.Clamp(rotationX, -lookXLimit, lookXLimit);
            playerCamera.transform.localRotation = Quaternion.Euler(rotationX, 0f, 0f);
        }
    }
}
