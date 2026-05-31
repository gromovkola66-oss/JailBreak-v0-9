using UnityEngine;

public enum BotState
{
    Idle,
    Patrol,
    Attack,
    Dead
}

public class BotController : MonoBehaviour
{
    public Team team = Team.None;
    public BotState state = BotState.Idle;
    public Vector3[] waypoints;
    public float walkSpeed = 3f;
    public float runSpeed = 5f;
    public float detectionRange = 30f;
    public float fireInterval = 0.3f;
    public float waypointReachDistance = 1.5f;
    public float damage = 20f;
    public float detectionInterval = 0.5f;

    private int currentWaypointIndex = 0;
    private Transform currentTarget = null;
    private float fireTimer = 0f;
    private float detectionTimer = 0f;
    private CharacterController controller;
    private float gravity = -20f;
    private float verticalVelocity = 0f;

    void Start()
    {
        controller = GetComponent<CharacterController>();
        if (waypoints != null && waypoints.Length > 0)
            state = BotState.Patrol;
        else
            state = BotState.Idle;
    }

    void Update()
    {
        if (state == BotState.Dead) return;

        detectionTimer -= Time.deltaTime;
        if (detectionTimer <= 0f)
        {
            DetectEnemies();
            detectionTimer = detectionInterval;
        }

        switch (state)
        {
            case BotState.Idle:
                break;
            case BotState.Patrol:
                Patrol();
                break;
            case BotState.Attack:
                AttackTarget();
                break;
        }

        ApplyGravity();
    }

    private void DetectEnemies()
    {
        currentTarget = null;
        float closestDist = detectionRange;

        DamageReceiver[] receivers = FindObjectsByType<DamageReceiver>(FindObjectsSortMode.None);
        foreach (DamageReceiver dr in receivers)
        {
            if (dr.gameObject == gameObject) continue;
            if (dr.team == team) continue;
            if (dr.team == Team.None) continue;

            HealthSystem hs = dr.GetComponent<HealthSystem>();
            BotHealth bh = dr.GetComponent<BotHealth>();
            bool alive = (hs != null && hs.IsAlive) || (bh != null && bh.IsAlive);
            if (!alive) continue;

            float dist = Vector3.Distance(transform.position, dr.transform.position);
            if (dist > detectionRange) continue;

            Vector3 dir = (dr.transform.position - transform.position).normalized;
            dir.y += 0.5f;
            Ray ray = new Ray(transform.position + Vector3.up * 1.5f, dir);
            RaycastHit hit;

            if (Physics.Raycast(ray, out hit, detectionRange))
            {
                DamageReceiver hitDR = hit.collider.GetComponent<DamageReceiver>();
                if (hitDR == null)
                    hitDR = hit.collider.GetComponentInParent<DamageReceiver>();

                if (hitDR != null && hitDR.gameObject == dr.gameObject)
                {
                    if (dist < closestDist)
                    {
                        closestDist = dist;
                        currentTarget = dr.transform;
                    }
                }
            }
        }

        if (currentTarget != null)
            state = BotState.Attack;
        else if (waypoints != null && waypoints.Length > 0)
            state = BotState.Patrol;
        else
            state = BotState.Idle;
    }

    private void Patrol()
    {
        if (waypoints == null || waypoints.Length == 0) return;

        Vector3 target = waypoints[currentWaypointIndex];
        Vector3 direction = target - transform.position;
        direction.y = 0f;

        if (direction.magnitude < waypointReachDistance)
        {
            currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.Length;
            return;
        }

        direction.Normalize();
        Quaternion lookRot = Quaternion.LookRotation(direction);
        transform.rotation = Quaternion.Slerp(transform.rotation, lookRot, 5f * Time.deltaTime);

        if (controller != null)
        {
            controller.Move(direction * walkSpeed * Time.deltaTime);
        }
        else
        {
            transform.position += direction * walkSpeed * Time.deltaTime;
        }
    }

    private void AttackTarget()
    {
        if (currentTarget == null)
        {
            state = BotState.Patrol;
            return;
        }

        Vector3 dir = (currentTarget.position - transform.position);
        dir.y = 0f;
        if (dir.magnitude > 0.1f)
        {
            Quaternion lookRot = Quaternion.LookRotation(dir.normalized);
            transform.rotation = Quaternion.Slerp(transform.rotation, lookRot, 8f * Time.deltaTime);
        }

        fireTimer -= Time.deltaTime;
        if (fireTimer <= 0f)
        {
            FireAtTarget();
            fireTimer = fireInterval;
        }
    }

    private void FireAtTarget()
    {
        if (currentTarget == null) return;

        Vector3 origin = transform.position + Vector3.up * 1.5f;
        Vector3 dir = (currentTarget.position + Vector3.up * 0.5f - origin).normalized;

        Ray ray = new Ray(origin, dir);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, detectionRange))
        {
            DamageReceiver dr = hit.collider.GetComponent<DamageReceiver>();
            if (dr == null)
                dr = hit.collider.GetComponentInParent<DamageReceiver>();

            if (dr != null && dr.gameObject == currentTarget.gameObject)
            {
                dr.TakeDamage(damage, gameObject.name, team, "Bot Weapon");
            }
        }
    }

    private void ApplyGravity()
    {
        if (controller == null) return;
        if (controller.isGrounded)
        {
            verticalVelocity = -2f;
        }
        else
        {
            verticalVelocity += gravity * Time.deltaTime;
        }
        controller.Move(Vector3.up * verticalVelocity * Time.deltaTime);
    }

    public void SetDead()
    {
        state = BotState.Dead;
    }

    public void ResetBot()
    {
        state = BotState.Patrol;
        currentWaypointIndex = 0;
        currentTarget = null;

        if (TeamManager.Instance != null)
        {
            Vector3 spawn = TeamManager.Instance.GetSpawnPoint(team);
            if (controller != null)
            {
                controller.enabled = false;
                transform.position = spawn;
                controller.enabled = true;
            }
            else
            {
                transform.position = spawn;
            }
        }
    }
}
