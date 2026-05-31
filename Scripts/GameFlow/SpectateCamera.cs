using UnityEngine;
using UnityEngine.InputSystem;

public class SpectateCamera : MonoBehaviour
{
    public float flySpeed = 8f;
    public float mouseSensitivity = 2f;

    private bool isActive = false;
    private Camera spectateCamera;
    private float xRotation = 0f;

    void Start()
    {
        spectateCamera = GetComponent<Camera>();
        if (spectateCamera == null)
            spectateCamera = gameObject.AddComponent<Camera>();
        spectateCamera.enabled = false;
    }

    public void EnableSpectate(Vector3 position, Quaternion rotation)
    {
        isActive = true;
        transform.position = position;
        transform.rotation = rotation;
        xRotation = rotation.eulerAngles.x;
        if (xRotation > 180f) xRotation -= 360f;

        if (spectateCamera != null)
            spectateCamera.enabled = true;
    }

    public void DisableSpectate()
    {
        isActive = false;
        if (spectateCamera != null)
            spectateCamera.enabled = false;
    }

    void Update()
    {
        if (!isActive) return;
        if (Cursor.lockState != CursorLockMode.Locked) return;

        Keyboard keyboard = Keyboard.current;
        Mouse mouse = Mouse.current;
        if (keyboard == null || mouse == null) return;

        Vector2 mouseDelta = mouse.delta.ReadValue();
        float mouseX = mouseDelta.x * mouseSensitivity * 0.1f;
        float mouseY = mouseDelta.y * mouseSensitivity * 0.1f;

        xRotation -= mouseY;
        xRotation = Mathf.Clamp(xRotation, -85f, 85f);

        transform.localRotation = Quaternion.Euler(xRotation, transform.eulerAngles.y + mouseX, 0f);

        float moveX = 0f;
        float moveY = 0f;
        float moveZ = 0f;

        if (keyboard.wKey.isPressed) moveZ += 1f;
        if (keyboard.sKey.isPressed) moveZ -= 1f;
        if (keyboard.aKey.isPressed) moveX -= 1f;
        if (keyboard.dKey.isPressed) moveX += 1f;
        if (keyboard.spaceKey.isPressed) moveY += 1f;
        if (keyboard.leftCtrlKey.isPressed) moveY -= 1f;

        Vector3 move = transform.right * moveX + transform.forward * moveZ + Vector3.up * moveY;
        transform.position += move * flySpeed * Time.deltaTime;
    }
}
