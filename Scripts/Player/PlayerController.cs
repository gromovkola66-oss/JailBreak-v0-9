using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float walkSpeed = 5f;
    public float sprintSpeed = 9f;
    public float crouchSpeed = 2.5f;
    public float jumpHeight = 1.2f;
    public float gravity = -20f;

    [Header("Camera")]
    public float mouseSensitivity = 2f;
    public float maxLookAngle = 85f;

    [Header("Crouch")]
    public float normalHeight = 2f;
    public float crouchHeight = 1.2f;
    public float crouchTransitionSpeed = 8f;

    private CharacterController controller;
    private Transform cameraHolder;
    private float verticalVelocity;
    private float cameraPitch;
    private bool isCrouching;
    private bool isSprinting;

    private Mouse mouse;
    private Keyboard keyboard;

    void Start()
    {
        controller = GetComponent<CharacterController>();

        cameraHolder = transform.Find("CameraHolder");
        if (cameraHolder == null)
        {
            Debug.LogError("PlayerController: CameraHolder not found! Use JailBreak > Setup Scene to build the scene.");
            return;
        }

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        mouse = Mouse.current;
        keyboard = Keyboard.current;
    }

    void Update()
    {
        if (mouse == null || keyboard == null)
        {
            mouse = Mouse.current;
            keyboard = Keyboard.current;
            if (mouse == null || keyboard == null) return;
        }

        HandleMouseLook();
        HandleMovement();
        HandleCrouch();
    }

    void HandleMouseLook()
    {
        if (cameraHolder == null) return;

        Vector2 mouseDelta = mouse.delta.ReadValue();
        float mouseX = mouseDelta.x * mouseSensitivity * 0.1f;
        float mouseY = mouseDelta.y * mouseSensitivity * 0.1f;

        transform.Rotate(Vector3.up * mouseX);

        cameraPitch -= mouseY;
        cameraPitch = Mathf.Clamp(cameraPitch, -maxLookAngle, maxLookAngle);
        cameraHolder.localRotation = Quaternion.Euler(cameraPitch, 0f, 0f);
    }

    void HandleMovement()
    {
        bool isGrounded = controller.isGrounded;

        if (isGrounded && verticalVelocity < 0f)
        {
            verticalVelocity = -2f;
        }

        isSprinting = keyboard.leftShiftKey.isPressed && !isCrouching;

        float currentSpeed = walkSpeed;
        if (isSprinting) currentSpeed = sprintSpeed;
        if (isCrouching) currentSpeed = crouchSpeed;

        float moveX = 0f;
        float moveZ = 0f;

        if (keyboard.wKey.isPressed) moveZ += 1f;
        if (keyboard.sKey.isPressed) moveZ -= 1f;
        if (keyboard.dKey.isPressed) moveX += 1f;
        if (keyboard.aKey.isPressed) moveX -= 1f;

        Vector3 moveDirection = transform.right * moveX + transform.forward * moveZ;
        if (moveDirection.magnitude > 1f) moveDirection.Normalize();

        controller.Move(moveDirection * currentSpeed * Time.deltaTime);

        if (keyboard.spaceKey.wasPressedThisFrame && isGrounded && !isCrouching)
        {
            verticalVelocity = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }

        verticalVelocity += gravity * Time.deltaTime;
        controller.Move(Vector3.up * verticalVelocity * Time.deltaTime);
    }

    void HandleCrouch()
    {
        if (keyboard.cKey.wasPressedThisFrame)
        {
            isCrouching = !isCrouching;
        }

        if (keyboard.leftCtrlKey.isPressed)
        {
            isCrouching = true;
        }
        else if (keyboard.leftCtrlKey.wasReleasedThisFrame)
        {
            isCrouching = false;
        }

        float targetHeight = isCrouching ? crouchHeight : normalHeight;
        controller.height = Mathf.Lerp(controller.height, targetHeight, crouchTransitionSpeed * Time.deltaTime);

        if (cameraHolder != null)
        {
            float targetCamY = (controller.height / 2f) - 0.1f;
            Vector3 camPos = cameraHolder.localPosition;
            camPos.y = Mathf.Lerp(camPos.y, targetCamY, crouchTransitionSpeed * Time.deltaTime);
            cameraHolder.localPosition = camPos;
        }
    }
}
