# goal

build from scratch in this folder: /home/vuos/code/p1/s4-trade/t3/

an application that helps crypto traders find good traders and tokens on solana and evms.

application should also find good risk reward trading ideas with statistical data.

application might need admin interface but I am not sure what functions to include there.

# output expected

## code

Production ready code with actual data connections and configs via UI and env vars.

folders: backend, frontend, tests
files: readme and all others needed for full production code

playwright test cases.

declarative code, with clear separation between code and data.

using metaprogramming and creating a domain specific language.

for example instead of defining each route in a flask or fastapi app do something like:

```python
import mf
mf.init('./a.db')
```

## ui and functions