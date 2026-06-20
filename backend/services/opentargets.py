import requests

OPEN_TARGETS_URL = "https://api.platform.opentargets.org/api/v4/graphql"


def search_disease(disease_name):

    query = f"""
    query {{
      search(queryString: "{disease_name}") {{
        hits {{
          id
          name
          entity
        }}
      }}
    }}
    """

    response = requests.post(
        OPEN_TARGETS_URL,
        json={"query": query}
    )

    return response.json()


def get_targets(disease_id):

    query = f"""
    query {{
      disease(efoId: "{disease_id}") {{
        associatedTargets(
          page: {{
            index: 0,
            size: 10
          }}
        ) {{
          rows {{
            score
            target {{
              id
              approvedSymbol
            }}
          }}
        }}
      }}
    }}
    """

    response = requests.post(
        OPEN_TARGETS_URL,
        json={"query": query}
    )

    return response.json()