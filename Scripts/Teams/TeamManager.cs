using UnityEngine;
using System.Collections.Generic;

public enum Team
{
    None,
    Guard,
    Prisoner
}

public class TeamManager : MonoBehaviour
{
    public static TeamManager Instance { get; private set; }

    public Vector3[] guardSpawnPoints = new Vector3[]
    {
        new Vector3(-10f, 1f, -12f),
        new Vector3(-10f, 1f, -10f),
        new Vector3(-12f, 1f, -10f),
        new Vector3(-12f, 1f, -12f)
    };

    public Vector3[] prisonerSpawnPoints = new Vector3[]
    {
        new Vector3(4f, 1f, -15f),
        new Vector3(4f, 1f, -10f),
        new Vector3(4f, 1f, -5f),
        new Vector3(4f, 1f, 5f),
        new Vector3(4f, 1f, 10f),
        new Vector3(4f, 1f, 15f)
    };

    private Dictionary<GameObject, Team> teamAssignments = new Dictionary<GameObject, Team>();

    void Awake()
    {
        if (Instance == null)
            Instance = this;
        else
            Destroy(gameObject);
    }

    public void AssignTeam(GameObject entity, Team team)
    {
        teamAssignments[entity] = team;

        PlayerController pc = entity.GetComponent<PlayerController>();
        if (pc != null) pc.team = team;

        DamageReceiver dr = entity.GetComponent<DamageReceiver>();
        if (dr != null) dr.team = team;

        BotController bot = entity.GetComponent<BotController>();
        if (bot != null) bot.team = team;
    }

    public Team GetTeam(GameObject entity)
    {
        Team t;
        if (teamAssignments.TryGetValue(entity, out t))
            return t;
        return Team.None;
    }

    public Vector3 GetSpawnPoint(Team team)
    {
        if (team == Team.Guard && guardSpawnPoints.Length > 0)
        {
            return guardSpawnPoints[Random.Range(0, guardSpawnPoints.Length)];
        }
        else if (team == Team.Prisoner && prisonerSpawnPoints.Length > 0)
        {
            return prisonerSpawnPoints[Random.Range(0, prisonerSpawnPoints.Length)];
        }
        return Vector3.zero;
    }

    public List<GameObject> GetTeamMembers(Team team)
    {
        List<GameObject> members = new List<GameObject>();
        foreach (var kvp in teamAssignments)
        {
            if (kvp.Value == team && kvp.Key != null)
                members.Add(kvp.Key);
        }
        return members;
    }

    public void ClearAssignments()
    {
        teamAssignments.Clear();
    }
}
