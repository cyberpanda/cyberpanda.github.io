/* CYBA Delta – browser-only demo backend.
   Answers the same /api routes as CybaKawa from an in-browser store (localStorage).
   Workflow validation, dry runs, templates, customer profiles, mappings and the OpenAPI
   import are ports of the Python code in engine/cybakawa and packages/delta. */
(() => {
  const FX = {"meta":{"product":"CYBA Delta","component":"CybaKawa","version":"1.9.0","store":{"kind":"demo","keeps_data":true,"single_instance":true},"capabilities":["workflows","start-stop","templates","apps","openapi-import","custom-connectors","runs","products","webhooks","spaces","customer-profiles","channels","soar-connector","ingest"]},"templates_raw":[{"key":"notify_critical","title":"Tell the team about critical alerts","summary":"A critical alert arrives, and the channel that customer uses hears about it.","category":"routine","variables":[{"name":"room","label":"Room or channel","type":"string","default":"soc"}],"workflow":{"name":"Notify on critical alert","nodes":[{"id":"t1","type":"trigger","trigger":"alert","position":{"x":80,"y":160}},{"id":"c1","type":"condition","position":{"x":300,"y":160},"conditions":[{"field":"event.alert.severity","op":"equals","value":"critical"}]},{"id":"a1","type":"action","channel":"chat","verb":"post","position":{"x":540,"y":90},"arguments":{"title":"Critical: {{ event.alert.title }}","text":"Host {{ event.host.name }} - please take a look.","room":"{{room}}"}},{"id":"e1","type":"end","position":{"x":780,"y":160}}],"edges":[{"source":"t1","target":"c1"},{"source":"c1","target":"a1","branch":"true"},{"source":"c1","target":"e1","branch":"false"},{"source":"a1","target":"e1"}]}},{"key":"ticket_for_case","title":"Open a ticket when a case starts","summary":"Every case gets a ticket, in whatever system that customer keeps.","category":"routine","variables":[{"name":"group","label":"Assign to group","type":"string","default":"SOC"}],"workflow":{"name":"Ticket for new case","nodes":[{"id":"t1","type":"trigger","trigger":"alert","position":{"x":80,"y":160}},{"id":"a1","type":"action","channel":"ticket","verb":"open","position":{"x":340,"y":160},"arguments":{"title":"{{ event.alert.title }}","body":"Opened from {{ event.source.name }}.","group":"{{group}}"}},{"id":"a2","type":"action","channel":"mail","verb":"send","position":{"x":600,"y":160},"continue_on_error":true,"arguments":{"to":"{{ event.customer.email }}","subject":"We are on it: {{ event.alert.title }}","body":"Your ticket {{ steps.a1.ticket }} is with our team."}},{"id":"e1","type":"end","position":{"x":850,"y":160}}],"edges":[{"source":"t1","target":"a1"},{"source":"a1","target":"a2"},{"source":"a2","target":"e1"}]}},{"key":"daily_digest","title":"Send a calm daily summary","summary":"Once a day, one message with the numbers. No pager, no noise.","category":"routine","variables":[{"name":"hour","label":"Time of day","type":"string","default":"08:00"},{"name":"recipient","label":"Send to","type":"string","default":"soc@example.com"}],"workflow":{"name":"Daily digest","nodes":[{"id":"t1","type":"trigger","trigger":"schedule","cron":"0 8 * * *","position":{"x":80,"y":160}},{"id":"a1","type":"action","channel":"mail","verb":"send","position":{"x":360,"y":160},"arguments":{"to":"{{recipient}}","subject":"Daily summary","body":"Open alerts: {{ event.open_alerts }}. Have a good shift."}},{"id":"e1","type":"end","position":{"x":640,"y":160}}],"edges":[{"source":"t1","target":"a1"},{"source":"a1","target":"e1"}]}},{"key":"triage_then_ask","title":"Ask before acting on a host","summary":"Check the alert, then ask the channel first. People stay in the loop.","category":"routine","variables":[],"workflow":{"name":"Ask before isolating","nodes":[{"id":"t1","type":"trigger","trigger":"alert","position":{"x":80,"y":160}},{"id":"c1","type":"condition","position":{"x":300,"y":160},"mode":"all","conditions":[{"field":"event.alert.severity","op":"in","value":["high","critical"]},{"field":"event.host.name","op":"exists","value":null}]},{"id":"a1","type":"action","channel":"chat","verb":"post","position":{"x":560,"y":90},"arguments":{"text":"{{ event.host.name }} looks affected. Isolate it? Reply in the thread.","title":"{{ event.alert.title }}"}},{"id":"e1","type":"end","position":{"x":820,"y":160}}],"edges":[{"source":"t1","target":"c1"},{"source":"c1","target":"a1","branch":"true"},{"source":"c1","target":"e1","branch":"false"},{"source":"a1","target":"e1"}]}}],"apps_full":[{"name":"mail","title":"Mail","version":"1.0.0","side":"respond","category":"notify","channel":"mail","description":"Send mail through an SMTP relay or a mail gateway.","base_url":"","auth":{"type":"basic"},"actions":[{"name":"send_mail","verb":"send","description":"Send a message to one or more recipients.","request":{"method":"POST","path":"/messages"},"parameters":[{"name":"to","type":"string","required":true,"location":"body","source_name":"to","description":"Recipient, comma separated"},{"name":"subject","type":"string","required":true,"location":"body","source_name":"subject"},{"name":"body","type":"string","required":true,"location":"body","source_name":"text"},{"name":"importance","type":"string","default":"normal","location":"body","source_name":"importance"}]}]},{"name":"chat","title":"Chat and Talk","version":"1.0.0","side":"respond","category":"notify","channel":"chat","description":"Post messages to a chat room over an incoming webhook.","base_url":"","auth":{"type":"none"},"actions":[{"name":"post_message","verb":"post","description":"Post a message into a room.","request":{"method":"POST","path":""},"parameters":[{"name":"text","type":"string","required":true,"location":"body","source_name":"text"},{"name":"room","type":"string","location":"body","source_name":"room"},{"name":"title","type":"string","location":"body","source_name":"title"}]}]},{"name":"teams","title":"Teams","version":"1.0.0","side":"respond","category":"notify","channel":"chat","description":"Post an adaptive message card to a Teams channel webhook.","base_url":"","auth":{"type":"none"},"actions":[{"name":"post_card","verb":"post","description":"Post a message card to a channel.","request":{"method":"POST","path":""},"parameters":[{"name":"title","type":"string","required":true,"location":"body","source_name":"title"},{"name":"text","type":"string","required":true,"location":"body","source_name":"text"},{"name":"theme_color","type":"string","default":"35CABE","location":"body","source_name":"themeColor"}]}]},{"name":"ticket","title":"Ticket System","version":"1.0.0","side":"respond","category":"ticket","channel":"ticket","description":"Create and close tickets in a helpdesk that speaks REST.","base_url":"","auth":{"type":"bearer"},"actions":[{"name":"create_ticket","verb":"open","description":"Open a ticket.","reverts":"close_ticket","request":{"method":"POST","path":"/tickets"},"parameters":[{"name":"title","type":"string","required":true,"location":"body","source_name":"title"},{"name":"body","type":"string","location":"body","source_name":"body"},{"name":"group","type":"string","location":"body","source_name":"group"},{"name":"priority","type":"integer","default":3,"location":"body","source_name":"priority"}]},{"name":"close_ticket","verb":"close","description":"Close a ticket.","request":{"method":"PUT","path":"/tickets/{id}"},"parameters":[{"name":"id","type":"string","required":true,"location":"path","source_name":"id"},{"name":"note","type":"string","location":"body","source_name":"note"}]},{"name":"comment_ticket","verb":"comment","description":"Add a comment to a ticket.","request":{"method":"POST","path":"/tickets/{id}/comments"},"parameters":[{"name":"id","type":"string","required":true,"location":"path","source_name":"id"},{"name":"text","type":"string","required":true,"location":"body","source_name":"text"}]}]},{"name":"zammad","title":"Zammad","version":"1.0.0","side":"respond","category":"ticket","channel":"ticket","description":"Open, comment and close tickets in Zammad.","base_url":"","auth":{"type":"bearer"},"actions":[{"name":"create_ticket","verb":"open","description":"Open a ticket.","reverts":"close_ticket","request":{"method":"POST","path":"/api/v1/tickets"},"parameters":[{"name":"title","type":"string","required":true,"location":"body","source_name":"title"},{"name":"body","type":"string","required":true,"location":"body","source_name":"article_body"},{"name":"group","type":"string","default":"Users","location":"body","source_name":"group"},{"name":"customer","type":"string","location":"body","source_name":"customer_id"},{"name":"priority","type":"string","default":"2 normal","location":"body","source_name":"priority"}]},{"name":"comment_ticket","verb":"comment","description":"Add an article to a ticket.","request":{"method":"POST","path":"/api/v1/ticket_articles"},"parameters":[{"name":"ticket","type":"string","required":true,"location":"body","source_name":"ticket_id"},{"name":"body","type":"string","required":true,"location":"body","source_name":"body"},{"name":"internal","type":"boolean","default":true,"location":"body","source_name":"internal"}]},{"name":"close_ticket","verb":"close","description":"Close a ticket.","request":{"method":"PUT","path":"/api/v1/tickets/{id}"},"parameters":[{"name":"id","type":"string","required":true,"location":"path","source_name":"id"},{"name":"state","type":"string","default":"closed","location":"body","source_name":"state"}]}]},{"name":"jira","title":"Jira","version":"1.0.0","side":"respond","category":"ticket","channel":"ticket","description":"Create and transition issues in Jira.","base_url":"","auth":{"type":"basic"},"actions":[{"name":"create_issue","verb":"open","description":"Create an issue.","reverts":"close_issue","request":{"method":"POST","path":"/rest/api/3/issue"},"parameters":[{"name":"project","type":"string","required":true,"location":"body","source_name":"project"},{"name":"title","type":"string","required":true,"location":"body","source_name":"summary"},{"name":"body","type":"string","location":"body","source_name":"description"},{"name":"issue_type","type":"string","default":"Task","location":"body","source_name":"issuetype"},{"name":"priority","type":"string","location":"body","source_name":"priority"}]},{"name":"comment_issue","verb":"comment","description":"Add a comment.","request":{"method":"POST","path":"/rest/api/3/issue/{key}/comment"},"parameters":[{"name":"key","type":"string","required":true,"location":"path","source_name":"key"},{"name":"body","type":"string","required":true,"location":"body","source_name":"body"}]},{"name":"close_issue","verb":"close","description":"Move an issue to done.","request":{"method":"POST","path":"/rest/api/3/issue/{key}/transitions"},"parameters":[{"name":"key","type":"string","required":true,"location":"path","source_name":"key"},{"name":"transition","type":"string","default":"31","location":"body","source_name":"transition"}]}]},{"name":"nextcloud_talk","title":"Nextcloud Talk","version":"1.0.0","side":"respond","category":"notify","channel":"chat","description":"Post into a Nextcloud Talk room.","base_url":"","auth":{"type":"basic"},"actions":[{"name":"post_message","verb":"post","description":"Post a message into a room.","request":{"method":"POST","path":"/ocs/v2.php/apps/spreed/api/v1/chat/{room}"},"parameters":[{"name":"room","type":"string","required":true,"location":"path","source_name":"room"},{"name":"text","type":"string","required":true,"location":"body","source_name":"message"},{"name":"reply_to","type":"integer","location":"body","source_name":"replyTo"}]}]},{"name":"webex","title":"Cisco Webex","version":"1.0.0","side":"respond","category":"notify","channel":"chat","description":"Post into a Webex space.","base_url":"https://webexapis.com","auth":{"type":"bearer"},"actions":[{"name":"post_message","verb":"post","description":"Post a message into a space.","request":{"method":"POST","path":"/v1/messages"},"parameters":[{"name":"room","type":"string","required":true,"location":"body","source_name":"roomId"},{"name":"text","type":"string","required":true,"location":"body","source_name":"markdown"}]}]},{"name":"webhook_in","title":"Inbound Webhook","version":"1.0.0","side":"normalize","category":"ingest","channel":"webhook","description":"Accept events from any sender and map them with a profile.","auth":{"type":"api_key","in":"header","name":"X-API-Key"},"actions":[{"name":"receive_event","verb":"receive","description":"Take a raw event and map it to the unified schema.","parameters":[{"name":"profile","type":"string","required":true,"description":"Mapping profile key"}]}]},{"name":"wazuh","title":"Wazuh","version":"1.0.0","side":"normalize","category":"ingest","channel":"siem","description":"Take alerts from Wazuh and map them.","auth":{"type":"api_key","in":"header","name":"X-API-Key"},"actions":[{"name":"receive_event","verb":"receive","description":"Take an alert and map it to the unified schema.","parameters":[{"name":"profile","type":"string","required":true,"description":"Mapping profile key"}]}]},{"name":"splunk","title":"Splunk","version":"1.0.0","side":"normalize","category":"ingest","channel":"siem","description":"Take notable events from Splunk and map them.","auth":{"type":"bearer"},"actions":[{"name":"receive_event","verb":"receive","description":"Take a notable event and map it to the unified schema.","parameters":[{"name":"profile","type":"string","required":true,"description":"Mapping profile key"}]}]}],"workflows_full":[{"name":"Notify on critical alert","nodes":[{"id":"t1","type":"trigger","trigger":"alert","position":{"x":80,"y":160}},{"id":"c1","type":"condition","position":{"x":300,"y":160},"conditions":[{"field":"event.alert.severity","op":"equals","value":"critical"}]},{"id":"a1","type":"action","channel":"chat","verb":"post","position":{"x":540,"y":90},"arguments":{"title":"Critical: {{ event.alert.title }}","text":"Host {{ event.host.name }} - please take a look.","room":"soc"}},{"id":"e1","type":"end","position":{"x":780,"y":160}}],"edges":[{"source":"t1","target":"c1"},{"source":"c1","target":"a1","branch":"true"},{"source":"c1","target":"e1","branch":"false"},{"source":"a1","target":"e1"}],"template":"notify_critical","state":"running","id":"526f192274db","updated_at":1793659853.7719803},{"name":"Ticket for new case","nodes":[{"id":"t1","type":"trigger","trigger":"alert","position":{"x":80,"y":160}},{"id":"a1","type":"action","channel":"ticket","verb":"open","position":{"x":340,"y":160},"arguments":{"title":"{{ event.alert.title }}","body":"Opened from {{ event.source.name }}.","group":"SOC"}},{"id":"a2","type":"action","channel":"mail","verb":"send","position":{"x":600,"y":160},"continue_on_error":true,"arguments":{"to":"{{ event.customer.email }}","subject":"We are on it: {{ event.alert.title }}","body":"Your ticket {{ steps.a1.ticket }} is with our team."}},{"id":"e1","type":"end","position":{"x":850,"y":160}}],"edges":[{"source":"t1","target":"a1"},{"source":"a1","target":"a2"},{"source":"a2","target":"e1"}],"template":"ticket_for_case","state":"running","id":"c51694a26dc1","updated_at":1793659853.7721336},{"name":"Daily digest","nodes":[{"id":"t1","type":"trigger","trigger":"schedule","cron":"0 8 * * *","position":{"x":80,"y":160}},{"id":"a1","type":"action","channel":"mail","verb":"send","position":{"x":360,"y":160},"arguments":{"to":"soc@example.com","subject":"Daily summary","body":"Open alerts: {{ event.open_alerts }}. Have a good shift."}},{"id":"e1","type":"end","position":{"x":640,"y":160}}],"edges":[{"source":"t1","target":"a1"},{"source":"a1","target":"e1"}],"template":"daily_digest","state":"stopped","id":"34564e907f0e","updated_at":1793659853.7716784},{"name":"Ask before isolating","nodes":[{"id":"t1","type":"trigger","trigger":"alert","position":{"x":80,"y":160}},{"id":"c1","type":"condition","position":{"x":300,"y":160},"mode":"all","conditions":[{"field":"event.alert.severity","op":"in","value":["high","critical"]},{"field":"event.host.name","op":"exists","value":null}]},{"id":"a1","type":"action","channel":"chat","verb":"post","position":{"x":560,"y":90},"arguments":{"text":"{{ event.host.name }} looks affected. Isolate it? Reply in the thread.","title":"{{ event.alert.title }}"}},{"id":"e1","type":"end","position":{"x":820,"y":160}}],"edges":[{"source":"t1","target":"c1"},{"source":"c1","target":"a1","branch":"true"},{"source":"c1","target":"e1","branch":"false"},{"source":"a1","target":"e1"}],"template":"triage_then_ask","state":"stopped","id":"0f9e19277eaf","updated_at":1793659853.7717712}],"bindings":[{"customer":"acme","side":"respond","channel":"ticket","app":"zammad","config":{"defaults":{"group":"SOC"}},"active":true},{"customer":"acme","side":"respond","channel":"chat","app":"teams","config":{},"active":true},{"customer":"acme","side":"respond","channel":"mail","app":"mail","config":{},"active":true},{"customer":"globex","side":"respond","channel":"ticket","app":"jira","config":{"defaults":{"project":"SEC"}},"active":true},{"customer":"globex","side":"respond","channel":"chat","app":"webex","config":{},"active":true},{"customer":"globex","side":"normalize","channel":"siem","app":"splunk","config":{"source_name":"splunk-globex"},"active":true},{"customer":"*","side":"respond","channel":"mail","app":"mail","config":{},"active":true},{"customer":"initech","side":"respond","channel":"chat","app":"nextcloud_talk","config":{},"active":true},{"customer":"initech","side":"normalize","channel":"webhook","app":"webhook_in","config":{"source_name":"initech-edr"},"active":true},{"customer":"acme","side":"normalize","channel":"siem","app":"wazuh","config":{"source_name":"wazuh-acme-prod","key_hash":"b4328035f5330bb63446319e8b37c4781da5d7d187781bc26b40c2e815e9de49"},"active":true}],"runs":[{"workflow_id":"0f9e19277eaf","workflow":"Ask before isolating","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"c1","type":"condition","status":"ok","result":false},{"node":"e1","type":"end","status":"ok"}],"id":"fb1993a80b39","created_at":1793659853.7759366},{"workflow_id":"0f9e19277eaf","workflow":"Ask before isolating","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"c1","type":"condition","status":"ok","result":true},{"node":"a1","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"text":"vpn-gw-01 looks affected. Isolate it? Reply in the thread.","title":"Brute force on vpn-gw-01"}}},{"node":"e1","type":"end","status":"ok"}],"id":"6173e29fca8e","created_at":1793659853.7758422},{"workflow_id":"34564e907f0e","workflow":"Daily digest","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"a1","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"to":"soc@example.com","subject":"Daily summary","body":"Open alerts: . Have a good shift."}}},{"node":"e1","type":"end","status":"ok"}],"id":"851b6d1fd2b5","created_at":1793659853.775742},{"workflow_id":"34564e907f0e","workflow":"Daily digest","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"a1","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"to":"soc@example.com","subject":"Daily summary","body":"Open alerts: . Have a good shift."}}},{"node":"e1","type":"end","status":"ok"}],"id":"6bc8275d0f57","created_at":1793659853.775666},{"workflow_id":"c51694a26dc1","workflow":"Ticket for new case","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"a1","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"title":"Brute force on vpn-gw-01","body":"Opened from .","group":"SOC"}}},{"node":"a2","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"to":null,"subject":"We are on it: Brute force on vpn-gw-01","body":"Your ticket  is with our team."}}},{"node":"e1","type":"end","status":"ok"}],"id":"1b077b9c9f35","created_at":1793659853.7755804},{"workflow_id":"c51694a26dc1","workflow":"Ticket for new case","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"a1","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"title":"Brute force on vpn-gw-01","body":"Opened from .","group":"SOC"}}},{"node":"a2","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"to":null,"subject":"We are on it: Brute force on vpn-gw-01","body":"Your ticket  is with our team."}}},{"node":"e1","type":"end","status":"ok"}],"id":"d3afacd68922","created_at":1793659853.7754838},{"workflow_id":"526f192274db","workflow":"Notify on critical alert","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"c1","type":"condition","status":"ok","result":false},{"node":"e1","type":"end","status":"ok"}],"id":"7a5767eafb7b","created_at":1793659853.7753856},{"workflow_id":"526f192274db","workflow":"Notify on critical alert","status":"completed","dry_run":true,"errors":[],"steps":[{"node":"c1","type":"condition","status":"ok","result":true},{"node":"a1","type":"action","status":"ok","result":{"ok":true,"detail":"dry run","arguments":{"title":"Critical: Brute force on vpn-gw-01","text":"Host vpn-gw-01 - please take a look.","room":"soc"}}},{"node":"e1","type":"end","status":"ok"}],"id":"60ba2d031572","created_at":1793659853.7752812}],"products":[{"name":"cybaban","title":"CybaBan","role":"Shifts and handover","summary":"Who is on, what is open, and what the next shift needs to know.","url":"duty/","compose_profile":"duty","services":["cybaban-backend","cybaban-web"],"sends_events":false,"docs":"https://github.com/cyberpanda/cyba-delta/tree/main/products/cybaban","up":true,"start_hint":"Demo in your browser"},{"name":"cybamado","title":"CybaMado","role":"The customer portal","summary":"What we do for a customer, in their words, and their word before we act.","url":"portal/","compose_profile":"portal","services":["cybamado-backend","cybamado-web"],"sends_events":false,"docs":"https://github.com/cyberpanda/cyba-delta/tree/main/products/cybamado","up":true,"start_hint":"Demo in your browser"},{"name":"cybasoa","title":"CybaSoa","role":"Security operations","summary":"Alerts, cases, and response that always keeps a second pair of eyes.","url":"soc/","compose_profile":"soc","services":["soa-postgres","soa-redis","cybasoa-backend","cybasoa-web"],"sends_events":true,"docs":"https://github.com/cyberpanda/cyba-delta/tree/main/products/cybasoa","up":true,"start_hint":"Demo in your browser"}],"spaces":[{"name":"cyba-delta","title":"CYBA Delta","wordmark":["CYBA","Delta"],"role":"Automation and integration","summary":"Flows, apps, and the roof over the family.","url":"/","logo":"assets/logos/cyba-delta.png","logo_style":"lockup","kind":"roof","up":true,"start_hint":""},{"name":"cybakawa","title":"CybaKawa","wordmark":["Cyba","Kawa"],"role":"The flow engine","summary":"What actually carries a flow from one step to the next.","url":"https://github.com/cyberpanda/cyba-delta/tree/main/engine","logo":"assets/logos/cybakawa.png","logo_style":"lockup","kind":"engine","up":true,"start_hint":"Demo in your browser"},{"name":"cybaban","title":"CybaBan","wordmark":["Cyba","Ban"],"role":"Shifts and handover","summary":"Who is on, what is open, and what the next shift needs to know.","url":"duty/","logo":"assets/logos/cybaban.png","logo_style":"lockup","kind":"product","up":true,"start_hint":"Demo in your browser"},{"name":"cybamado","title":"CybaMado","wordmark":["Cyba","Mado"],"role":"The customer portal","summary":"What we do for a customer, in their words, and their word before we act.","url":"portal/","logo":"assets/logos/cybamado.png","logo_style":"lockup","kind":"product","up":true,"start_hint":"Demo in your browser"},{"name":"cybasoa","title":"CybaSoa","wordmark":["Cyba","Soa"],"role":"Security operations","summary":"Alerts, cases, and response that keeps a second pair of eyes.","url":"soc/","logo":"assets/logos/cybasoa.png","logo_style":"lockup","kind":"product","up":true,"start_hint":"Demo in your browser"}],"channels_def":{"normalize":[["siem","SIEM events"],["edr","Endpoint events"],["mail","Mail gateway"],["cloud","Cloud audit"],["webhook","Anything that can post"]],"respond":[["ticket","Tickets"],["chat","Chat and talk"],["mail","Mail"],["firewall","Firewall"],["edr","Endpoint"],["identity","Identity"]]},"mappings":{"delta":[{"target":"alert.id","sources":["alert.id"]},{"target":"alert.title","sources":["alert.title"]},{"target":"alert.severity","sources":["alert.severity"]},{"target":"alert.rule_id","sources":["alert.rule_id"]},{"target":"alert.rule_name","sources":["alert.rule_name"]},{"target":"alert.tags","sources":["alert.tags"]},{"target":"event.start","sources":["event.start"]},{"target":"event.end","sources":["event.end"]},{"target":"event.category","sources":["event.category"]},{"target":"event.action","sources":["event.action"]},{"target":"source.ip","sources":["source.ip"]},{"target":"source.port","sources":["source.port"]},{"target":"source.name","sources":["source.name"]},{"target":"source.type","sources":["source.type"]},{"target":"destination.ip","sources":["destination.ip"]},{"target":"destination.port","sources":["destination.port"]},{"target":"host.name","sources":["host.name"]},{"target":"host.id","sources":["host.id"]},{"target":"user.name","sources":["user.name"]},{"target":"user.domain","sources":["user.domain"]},{"target":"file.name","sources":["file.name"]},{"target":"file.hash","sources":["file.hash"]},{"target":"process.name","sources":["process.name"]},{"target":"process.command_line","sources":["process.command_line"]},{"target":"customer.id","sources":["customer.id"]},{"target":"observer.sensor","sources":["observer.sensor"]},{"target":"observer.location","sources":["observer.location"]}],"sentinel":[{"target":"alert.id","sources":["SystemAlertId","id"]},{"target":"alert.title","sources":["AlertName","DisplayName"]},{"target":"alert.severity","sources":["AlertSeverity","Severity"]},{"target":"event.start","sources":["TimeGenerated","StartTime"]},{"target":"host.name","sources":["CompromisedEntity","Computer"]},{"target":"user.name","sources":["AccountName","UserPrincipalName"]},{"target":"source.ip","sources":["IPAddress","SourceIP"]}],"splunk":[{"target":"alert.id","sources":["event_id","sid","_cd"]},{"target":"alert.title","sources":["search_name","rule_title"]},{"target":"alert.severity","sources":["urgency","severity"]},{"target":"event.start","sources":["_time","timestamp"]},{"target":"host.name","sources":["dest","host","dest_nt_host"]},{"target":"user.name","sources":["user","src_user"]},{"target":"source.ip","sources":["src_ip","src"]},{"target":"destination.ip","sources":["dest_ip"]},{"target":"event.category","sources":["eventtype","search_name"]}],"wazuh":[{"target":"alert.id","sources":["id","_id"]},{"target":"alert.title","sources":["rule.description"]},{"target":"alert.severity","sources":["rule.level"],"transform":["wazuh_level"]},{"target":"alert.rule_id","sources":["rule.id"]},{"target":"event.start","sources":["timestamp","@timestamp"]},{"target":"host.name","sources":["agent.name","predecoder.hostname"]},{"target":"host.id","sources":["agent.id"]},{"target":"user.name","sources":["data.dstuser","data.srcuser","data.win.eventdata.targetUserName"]},{"target":"source.ip","sources":["data.srcip","data.win.eventdata.ipAddress"]},{"target":"destination.ip","sources":["data.dstip"]},{"target":"event.category","sources":["rule.groups.0"]},{"target":"alert.rule_name","sources":["rule.description"]}],"webhook_in":[{"target":"alert.id","sources":["id","alert_id","uuid"]},{"target":"alert.title","sources":["title","name","message","description"]},{"target":"alert.severity","sources":["severity","level","priority"],"default":"medium"},{"target":"event.start","sources":["timestamp","time","@timestamp"]},{"target":"host.name","sources":["host","hostname","device"]},{"target":"user.name","sources":["user","username","account"]},{"target":"source.ip","sources":["src_ip","source_ip","ip"]},{"target":"destination.ip","sources":["dst_ip","destination_ip"]}]},"canonical":["alert.id","alert.title","alert.severity","alert.rule_id","alert.rule_name","alert.tags","event.start","event.end","event.category","event.action","source.ip","source.port","source.name","source.type","destination.ip","destination.port","host.name","host.id","user.name","user.domain","file.name","file.hash","process.name","process.command_line","customer.id","observer.sensor","observer.location"],"verbs":{"siem":["receive"],"edr":["isolate","release","quarantine","unquarantine"],"mail":["send"],"cloud":["receive"],"webhook":["receive"],"ticket":["open","comment","close"],"chat":["post"],"firewall":["block","unblock"],"identity":["disable","enable","reset","logoff"]}};
  const KEY = "cyba-delta-demo-v1";
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const now = () => Date.now() / 1000;
  const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => b.toString(16).padStart(2, "0")).join("");
  const fresh = () => ({ workflows: clone(FX.workflows_full), apps: clone(FX.apps_full), bindings: clone(FX.bindings), runs: clone(FX.runs) });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  class HTTP extends Error { constructor(status, detail) { super(typeof detail === "string" ? detail : "error"); this.status = status; this.detail = detail; } }

  // ---- workflow.py -------------------------------------------------------------------------
  const NODE_TYPES = ["trigger", "action", "condition", "delay", "end"];
  const TRIGGERS = ["webhook", "schedule", "alert", "manual"];
  const outgoing = (edges, id, branch) => edges.filter((e) => e.source === id && (branch == null || e.branch == null || e.branch === branch)).map((e) => e.target);
  function validate(w) {
    const errors = [];
    if (!w.name) errors.push("workflow needs a name");
    const nodes = w.nodes || [], edges = w.edges || [];
    if (!nodes.length) { errors.push("workflow needs at least one node"); return errors; }
    const ids = nodes.map((n) => n.id);
    if (new Set(ids).size !== ids.length) errors.push("node ids must be unique");
    for (const n of nodes) {
      if (!n.id) errors.push("every node needs an id");
      if (!NODE_TYPES.includes(n.type)) errors.push(`${n.id}: unknown node type '${n.type}'`);
      if (n.type === "trigger" && !TRIGGERS.includes(n.trigger)) errors.push(`${n.id}: unknown trigger '${n.trigger}'`);
      if (n.type === "action") {
        const byApp = !!n.app && !!n.action, byCh = !!n.channel && !!n.verb;
        if (!byApp && !byCh) errors.push(`${n.id}: an action needs either an app and an action name, or a channel and a verb`);
        if (n.app && !n.action) errors.push(`${n.id}: action needs an action name`);
        if (n.channel && !n.verb) errors.push(`${n.id}: a channel step needs a verb`);
      }
      if (n.type === "condition" && !(n.conditions || []).length) errors.push(`${n.id}: condition needs at least one rule`);
    }
    const triggers = nodes.filter((n) => n.type === "trigger");
    if (triggers.length !== 1) errors.push("workflow needs exactly one trigger");
    for (const e of edges) {
      if (!ids.includes(e.source)) errors.push(`edge from unknown node '${e.source}'`);
      if (!ids.includes(e.target)) errors.push(`edge to unknown node '${e.target}'`);
    }
    if (!errors.length) {
      const seen = new Set([triggers[0].id]), stack = [triggers[0].id];
      while (stack.length) for (const t of outgoing(edges, stack.pop())) if (!seen.has(t)) { seen.add(t); stack.push(t); }
      nodes.filter((n) => !seen.has(n.id)).forEach((n) => errors.push(`node '${n.id}' cannot be reached from the trigger`));
      const col = {};
      const visit = (id) => { col[id] = 1; for (const t of outgoing(edges, id)) { if (col[t] === 1) return true; if (!col[t] && visit(t)) return true; } col[id] = 2; return false; };
      if (nodes.some((n) => !col[n.id] && visit(n.id))) errors.push("workflow contains a loop");
    }
    return errors;
  }
  const triggerNode = (w) => (w.nodes || []).find((n) => n.type === "trigger");
  const nextNodes = (w, id, branch) => { const by = Object.fromEntries((w.nodes || []).map((n) => [n.id, n])); return outgoing(w.edges || [], id, branch).filter((t) => by[t]).map((t) => by[t]); };

  // ---- runtime.py --------------------------------------------------------------------------
  const PH = /\{\{\s*([a-zA-Z0-9_.\[\]]+)\s*\}\}/g, PH1 = /^\{\{\s*([a-zA-Z0-9_.\[\]]+)\s*\}\}$/;
  function lookup(ctx, path) {
    let cur = ctx;
    for (const part of String(path).split(".")) {
      if (cur && typeof cur === "object" && !Array.isArray(cur)) { if (part in cur) { cur = cur[part]; continue; } return null; }
      if (Array.isArray(cur)) { if (/^\d+$/.test(part) && +part < cur.length) { cur = cur[+part]; continue; } return null; }
      return null;
    }
    return cur === undefined ? null : cur;
  }
  function resolve(v, ctx) {
    if (typeof v === "string") {
      const m = v.trim().match(PH1);
      if (m) return lookup(ctx, m[1]);
      return v.replace(PH, (_, p) => { const x = lookup(ctx, p); return x == null ? "" : String(x); });
    }
    if (Array.isArray(v)) return v.map((x) => resolve(x, ctx));
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x, ctx)]));
    return v;
  }
  const S_ = (x) => (x === null || x === undefined ? "None" : typeof x === "boolean" ? (x ? "True" : "False") : String(x));
  const OPS = {
    equals: (a, b) => S_(a) === S_(b), not_equals: (a, b) => S_(a) !== S_(b),
    contains: (a, b) => S_(a).includes(S_(b)), not_contains: (a, b) => !S_(a).includes(S_(b)),
    starts_with: (a, b) => S_(a).startsWith(S_(b)), ends_with: (a, b) => S_(a).endsWith(S_(b)),
    in: (a, b) => (Array.isArray(b) ? b : [b]).map(S_).includes(S_(a)),
    gt: (a, b) => +a > +b, gte: (a, b) => +a >= +b, lt: (a, b) => +a < +b, lte: (a, b) => +a <= +b,
    exists: (a) => a != null && a !== "", empty: (a) => a == null || a === "",
  };
  function checkCondition(c, ctx) {
    const op = OPS[c.op || "equals"]; if (!op) return false;
    let l = lookup(ctx, c.field || ""), r = resolve(c.value, ctx);
    if (typeof l === "string" && typeof r === "string") { l = l.toLowerCase(); r = r.toLowerCase(); }
    if (["gt", "gte", "lt", "lte"].includes(c.op) && (isNaN(parseFloat(l)) || isNaN(parseFloat(r)))) return false;
    return !!op(l, r);
  }
  const checkConditions = (cs, ctx, mode) => { const r = (cs || []).map((c) => checkCondition(c, ctx)); return !r.length ? true : mode !== "any" ? r.every(Boolean) : r.some(Boolean); };
  function run(w, event) {
    const errors = validate(w);
    if (errors.length) return { status: "invalid", errors, steps: [], context: {} };
    const ctx = { event, steps: {} }, steps = [];
    const queue = nextNodes(w, triggerNode(w).id); let visited = 0;
    while (queue.length) {
      if (visited >= 200) return { status: "aborted", errors: ["step limit reached"], steps, context: ctx };
      const n = queue.shift(); visited++;
      if (n.type === "end") { steps.push({ node: n.id, type: "end", status: "ok" }); break; }
      if (n.type === "delay") { steps.push({ node: n.id, type: "delay", status: "ok", seconds: n.seconds || 0 }); queue.push(...nextNodes(w, n.id)); continue; }
      if (n.type === "condition") { const p = checkConditions(n.conditions, ctx, n.mode || "all"); steps.push({ node: n.id, type: "condition", status: "ok", result: p }); queue.push(...nextNodes(w, n.id, p ? "true" : "false")); continue; }
      if (n.type === "action") {
        const args = resolve(n.arguments || {}, ctx), result = { ok: true, detail: "dry run", arguments: args };
        ctx.steps[n.id] = result; steps.push({ node: n.id, type: "action", status: "ok", result }); queue.push(...nextNodes(w, n.id)); continue;
      }
      steps.push({ node: n.id, type: n.type || "unknown", status: "skipped" });
    }
    return { status: "completed", errors: [], steps, context: ctx };
  }
  const addRun = (r) => { r.id = newId(); r.created_at = now(); S.runs.unshift(r); S.runs.length = Math.min(S.runs.length, 500); return clone(r); };

  // ---- templates.py ------------------------------------------------------------------------
  const fill = (v, vals) => typeof v === "string" ? Object.entries(vals).reduce((o, [k, g]) => o.split("{{" + k + "}}").join(String(g)), v)
    : Array.isArray(v) ? v.map((x) => fill(x, vals)) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x, vals)])) : v;
  function instantiate(key, values) {
    const t = FX.templates_raw.find((x) => x.key === key);
    if (!t) throw new HTTP(404, `'unknown template '${key}''`);
    const given = { ...(values || {}) };
    for (const v of t.variables) if (!(v.name in given)) given[v.name] = v.default ?? "";
    const w = fill(clone(t.workflow), given); w.template = key; w.state = "stopped"; return w;
  }
  const saveWorkflow = (w) => { w.id = w.id || newId(); w.state = w.state || "stopped"; w.updated_at = now(); const i = S.workflows.findIndex((x) => x.id === w.id); if (i >= 0) S.workflows[i] = w; else S.workflows.push(w); return clone(w); };

  // ---- delta bindings / mappings / normalize / openapi ------------------------------------
  const CH = FX.channels_def, SIDES = ["normalize", "respond"];
  const matches = (b, c, s, ch) => b.side === s && b.channel === ch && (b.customer === c || b.customer === "*") && b.active !== false;
  const resolveB = (rows, c, s, ch) => rows.find((b) => matches(b, c, s, ch) && b.customer === c) || rows.find((b) => matches(b, c, s, ch) && b.customer === "*") || null;
  const profile = (rows, c) => { const o = { customer: c, normalize: {}, respond: {} }; for (const s of SIDES) for (const [k, label] of CH[s]) { const f = resolveB(rows, c, s, k); o[s][k] = { label, app: f ? f.app : null, shared: !!(f && f.customer === "*"), config: (f && f.config) || {} }; } return o; };
  const coverage = (rows, c, s) => { const keys = CH[s].map((x) => x[0]), filled = keys.filter((k) => resolveB(rows, c, s, k)); return { bound: filled.length, total: keys.length, missing: keys.filter((k) => !filled.includes(k)) }; };
  const customers = (rows) => [...new Set(rows.map((b) => b.customer).filter((c) => c && c !== "*"))].sort();
  const TF = { lower: (v) => String(v).toLowerCase(), upper: (v) => String(v).toUpperCase(), strip: (v) => String(v).trim(), int: (v) => Math.trunc(parseFloat(v)), float: (v) => parseFloat(v),
    bool: (v) => ["1", "true", "yes", "on"].includes(String(v).trim().toLowerCase()), first: (v) => Array.isArray(v) && v.length ? v[0] : v, join: (v) => Array.isArray(v) ? v.join(", ") : v,
    basename: (v) => String(v).replace(/\\/g, "/").replace(/\/+$/, "").split("/").pop(),
    wazuh_level: (v) => { const n = Math.trunc(+v); if (isNaN(n)) throw 0; return n >= 12 ? "critical" : n >= 10 ? "high" : n >= 7 ? "medium" : n >= 4 ? "low" : "info"; } };
  function dotGet(p, path) {
    if (p && typeof p === "object" && !Array.isArray(p) && path in p) return p[path];
    let cur = p;
    for (const part of String(path).split(".")) {
      if (cur && typeof cur === "object" && !Array.isArray(cur)) { if (!(part in cur)) return null; cur = cur[part]; }
      else if (Array.isArray(cur)) { if (!/^\d+$/.test(part) || +part >= cur.length) return null; cur = cur[+part]; }
      else return null;
    }
    return cur;
  }
  function normalize(raw, rules) {
    const u = {}, prov = {}, warn = [];
    for (const r of [...(rules || [])].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))) {
      const t = r.target; if (!t) { warn.push("rule without target skipped"); continue; }
      if (t in u && u[t] != null && u[t] !== "") continue;
      for (const src of r.sources || []) {
        let v = dotGet(raw, src); if (v == null || v === "") continue;
        try { for (const n of r.transform || []) if (TF[n]) v = TF[n](v); if (typeof v === "number" && isNaN(v)) v = null; } catch { v = null; }
        if (v == null || v === "") continue;
        u[t] = v; prov[t] = src; break;
      }
      if (!(t in u) && "default" in r) { u[t] = r.default; prov[t] = "default"; }
    }
    return [u, prov, warn];
  }
  const nest = (u) => { const o = {}; for (const [k, v] of Object.entries(u)) { const ps = k.split("."); let c = o; for (const p of ps.slice(0, -1)) { if (!c[p] || typeof c[p] !== "object") c[p] = {}; c = c[p]; } c[ps.at(-1)] = v; } return o; };
  const leafPaths = (o, pre = "") => { let out = []; for (const [k, v] of Object.entries(o || {})) { const p = pre ? pre + "." + k : k; if (v && typeof v === "object" && !Array.isArray(v)) out = out.concat(leafPaths(v, p)); else if (Array.isArray(v)) v.forEach((x, i) => { if (x && typeof x === "object") out = out.concat(leafPaths(x, p + "." + i)); else out.push(p + "." + i); }); else out.push(p); } return out; };
  const slug = (v) => (String(v || "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase().replace(/_+/g, "_")) || "action";
  function fromOpenapi(doc, side) {
    if (!doc || typeof doc !== "object") throw new HTTP(400, "document must be an object");
    if (!(doc.openapi || doc.swagger)) throw new HTTP(400, "not an OpenAPI document");
    const info = doc.info || {}; if (!info.title) throw new HTTP(400, "info.title is required");
    const T = (s) => ["string", "integer", "number", "boolean", "object", "array"].includes((s || {}).type) ? s.type : "string";
    const actions = [];
    for (const [path, item] of Object.entries(doc.paths || {})) for (const m of ["get", "post", "put", "patch", "delete"]) {
      const op = item[m]; if (!op || typeof op !== "object") continue;
      const params = [];
      for (const r of [...(item.parameters || []), ...(op.parameters || [])]) { if (!r.name) continue; const e = { name: slug(r.name), type: T(r.schema || r), description: r.description || "", location: r.in || "query", source_name: r.name }; if (r.required) e.required = true; params.push(e); }
      const sch = ((((op.requestBody || {}).content || {})["application/json"] || {}).schema) || {}, req = new Set(sch.required || []);
      for (const [p, d] of Object.entries(sch.properties || {})) { const e = { name: slug(p), type: T(d), description: d.description || "", location: "body", source_name: p }; if (req.has(p)) e.required = true; params.push(e); }
      actions.push({ name: slug(op.operationId || `${m}_${path}`), description: op.summary || op.description || `${m.toUpperCase()} ${path}`, request: { method: m.toUpperCase(), path }, parameters: params });
    }
    if (!actions.length) throw new HTTP(400, "no operations found");
    const sv = (doc.servers || [])[0], base = sv && sv.url ? sv.url.replace(/\/$/, "") : doc.host ? `${(doc.schemes || ["https"])[0]}://${doc.host}${doc.basePath || ""}`.replace(/\/$/, "") : "";
    let auth = { type: "none" };
    for (const v of Object.values((doc.components || {}).securitySchemes || doc.securityDefinitions || {})) {
      const k = (v.type || "").toLowerCase();
      if (k === "http" && /bearer/i.test(v.scheme)) { auth = { type: "bearer" }; break; } if (k === "http" && /basic/i.test(v.scheme)) { auth = { type: "basic" }; break; }
      if (k === "apikey") { auth = { type: "api_key", in: v.in || "header", name: v.name || "X-API-Key" }; break; } if (k === "oauth2" || k === "openidconnect") { auth = { type: "oauth2" }; break; }
    }
    return { name: slug(info.title), title: info.title, version: String(info.version || "1.0.0"), side, description: info.description || "", base_url: base, auth, actions, generated_from: "openapi" };
  }
  function validateApp(a) {
    const e = [];
    if (!a || typeof a !== "object") return ["manifest must be an object"];
    if (!a.name || !/^[a-z][a-z0-9_]*$/.test(a.name)) e.push("name must be lower_snake_case");
    if (!SIDES.includes(a.side)) e.push("side must be normalize or respond");
    if (!Array.isArray(a.actions) || !a.actions.length) e.push("an app needs at least one action");
    else a.actions.forEach((x, i) => { if (!x.name) e.push(`action ${i + 1} needs a name`); });
    return e;
  }
  const appSummary = (a) => ({ name: a.name, title: a.title || a.name, side: a.side, category: a.category || "custom", version: a.version, description: a.description || "", base_url: a.base_url || "",
    auth: (a.auth || {}).type || "none", configured: !!((a.credentials && Object.keys(a.credentials).length) || (a.auth || {}).type === "none"),
    actions: (a.actions || []).map((x) => ({ name: x.name, description: x.description || "", parameters: x.parameters || [] })) });
  const verbsOf = (a) => [...new Set((a.actions || []).map((x) => x.verb).filter(Boolean))];

  // ---- routes ------------------------------------------------------------------------------
  const R = [];
  const route = (m, p, f) => R.push([m, new RegExp("^/api" + p.replace(/\{(\w+)\}/g, "(?<$1>[^/]+)") + "$"), f]);
  const wf = (id) => { const w = S.workflows.find((x) => x.id === id); if (!w) throw new HTTP(404, "workflow not found"); return w; };
  route("GET", "/health", () => ({ status: "ok", product: FX.meta.product, component: FX.meta.component, version: FX.meta.version }));
  route("GET", "/meta", () => FX.meta);
  route("GET", "/apps", () => S.apps.map(appSummary));
  route("POST", "/apps", (_, b) => { const e = validateApp(b); if (e.length) throw new HTTP(400, { errors: e }); S.apps = S.apps.filter((a) => a.name !== b.name).concat([b]); return clone(b); });
  route("POST", "/apps/import/openapi", (_, b) => { const a = fromOpenapi(b.document, b.side || "respond"); S.apps = S.apps.filter((x) => x.name !== a.name).concat([a]); return clone(a); });
  route("POST", "/apps/{name}/credentials", (p, b) => { const a = S.apps.find((x) => x.name === p.name); if (!a) throw new HTTP(404, "app not found"); a.credentials = Object.fromEntries(Object.keys(b.credentials || {}).map((k) => [k, "••••"])); if (b.base_url) a.base_url = b.base_url; return { name: p.name, configured: true }; });
  route("DELETE", "/apps/{name}", (p) => { const n = S.apps.length; S.apps = S.apps.filter((a) => a.name !== p.name); if (S.apps.length === n) throw new HTTP(404, "app not found"); return { deleted: p.name }; });
  route("GET", "/templates", () => FX.templates_raw.map((t) => ({ key: t.key, title: t.title, summary: t.summary, category: t.category, variables: t.variables })));
  route("POST", "/templates/{key}/use", (p, b) => saveWorkflow(instantiate(p.key, (b || {}).values)));
  route("GET", "/workflows", () => S.workflows.map((w) => ({ id: w.id, name: w.name, state: w.state, template: w.template, nodes: (w.nodes || []).length, valid: !validate(w).length })));
  route("POST", "/workflows", (_, b) => { const e = validate(b); if (e.length) throw new HTTP(400, { errors: e }); delete b.id; return saveWorkflow(b); });
  route("GET", "/workflows/{id}", (p) => ({ ...clone(wf(p.id)), errors: validate(wf(p.id)) }));
  route("PUT", "/workflows/{id}", (p, b) => { const c = wf(p.id); if (c.state === "running") throw new HTTP(409, "stop the workflow before changing it"); b.id = p.id; b.state = c.state || "stopped"; delete b.errors; return saveWorkflow(b); });
  route("DELETE", "/workflows/{id}", (p) => { wf(p.id); S.workflows = S.workflows.filter((w) => w.id !== p.id); return { deleted: p.id }; });
  route("POST", "/workflows/{id}/validate", (p) => { const e = validate(wf(p.id)); return { ok: !e.length, errors: e }; });
  route("POST", "/workflows/{id}/start", (p) => { const w = wf(p.id), e = validate(w); if (e.length) throw new HTTP(409, { errors: e }); if (w.state === "running") throw new HTTP(409, { errors: ["workflow is already running"] }); w.state = "running"; w.updated_at = now(); return clone(w); });
  route("POST", "/workflows/{id}/stop", (p) => { const w = wf(p.id); if (w.state !== "running") throw new HTTP(409, { errors: ["workflow is not running"] }); w.state = "stopped"; w.updated_at = now(); return clone(w); });
  route("POST", "/workflows/{id}/run", (p, b) => { const w = wf(p.id); b = b || {}; if (!b.dry_run) throw new HTTP(409, "The live demo only does test runs – nothing leaves your browser."); const r = run(w, b.event || {}); return addRun({ workflow_id: w.id, workflow: w.name, status: r.status, dry_run: true, errors: r.errors, steps: r.steps }); });
  route("GET", "/runs", (_, __, q) => S.runs.filter((r) => !q.workflow_id || r.workflow_id === q.workflow_id).slice(0, +(q.limit || 50)));
  route("GET", "/ingest/sources", () => S.bindings.filter((b) => b.side === "normalize").map((b) => { const c = b.config || {}; return { customer: b.customer, channel: b.channel, app: b.app, source_name: c.source_name || b.app, has_key: !!c.key_hash, forwards_to: (c.forward || {}).url || "", custom_mapping: !!c.mapping }; }));
  route("POST", "/bindings/{customer}/normalize/{channel}/key", (p) => { const b = S.bindings.find((x) => x.customer === decodeURIComponent(p.customer) && x.side === "normalize" && x.channel === p.channel); if (!b) throw new HTTP(404, "nothing bound there"); const raw = "cyd_demo_" + newId() + newId(); b.config = { ...(b.config || {}), key_hash: "demo:" + raw.slice(-6) }; return { customer: b.customer, channel: p.channel, api_key: raw, note: "This key is shown once. The SIEM sends it as X-API-Key. (Demo key – it only exists in your browser.)" }; });
  route("GET", "/mappings", () => Object.entries(FX.mappings).map(([app, rules]) => ({ app, rules, targets: rules.map((r) => r.target) })));
  route("POST", "/mappings/preview", (_, b) => {
    const raw = b.event; if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new HTTP(400, "event must be an object");
    const rules = b.mapping || FX.mappings[b.app || ""] || FX.mappings.webhook_in;
    const [u, prov, warn] = normalize(raw, rules);
    u["customer.id"] = b.customer || "t-example"; u["source.name"] = b.source_name || b.app || ""; u["source.type"] = b.app || "";
    const tags = [...(u["alert.tags"] || []), ...(b.tags || [])]; if (tags.length) u["alert.tags"] = [...new Set(tags.filter(Boolean))].sort();
    const missing = ["alert.title"].filter((f) => u[f] == null || u[f] === "");
    const used = new Set(Object.values(prov));
    return { unified: u, event: nest(u), provenance: prov, warnings: warn.concat(missing.map((f) => `nothing mapped to ${f}`)), usable: !missing.length,
      unmapped: FX.canonical.filter((k) => u[k] == null || u[k] === "").sort(), untouched: leafPaths(raw).filter((x) => !used.has(x)).sort() };
  });
  route("GET", "/channels", () => Object.fromEntries(SIDES.map((s) => [s, CH[s].map(([key, label]) => ({ key, label, verbs: FX.verbs[key] || [],
    apps: S.apps.filter((a) => a.side === s && a.channel === key).map((a) => ({ name: a.name, title: a.title || a.name, verbs: verbsOf(a) })) }))])));
  route("GET", "/profiles", () => customers(S.bindings).map((c) => ({ customer: c, normalize: coverage(S.bindings, c, "normalize"), respond: coverage(S.bindings, c, "respond") })));
  route("GET", "/profiles/{customer}", (p) => profile(S.bindings, decodeURIComponent(p.customer)));
  route("GET", "/bindings", (_, __, q) => S.bindings.filter((b) => !q.customer || b.customer === q.customer));
  route("POST", "/bindings", (_, b) => {
    const e = []; if (!b.customer) e.push("binding needs a customer, or * for everyone");
    if (!SIDES.includes(b.side)) e.push(`side must be one of ${SIDES.join(", ")}`); else if (!CH[b.side].some((c) => c[0] === b.channel)) e.push(`unknown ${b.side} channel '${b.channel}'`);
    const app = S.apps.find((a) => a.name === b.app);
    if (!b.app) e.push("binding needs an app"); else if (!app) e.push(`app '${b.app}' is not installed`);
    if (e.length) throw new HTTP(400, { errors: e });
    if (app.side !== b.side) throw new HTTP(400, { errors: [`${app.name} is a ${app.side} app, not ${b.side}`] });
    if (app.channel && app.channel !== b.channel) throw new HTTP(400, { errors: [`${app.name} serves ${app.channel}, not ${b.channel}`] });
    S.bindings = S.bindings.filter((x) => !(x.customer === b.customer && x.side === b.side && x.channel === b.channel)); b.active = b.active ?? true; S.bindings.push(b); return clone(b);
  });
  route("DELETE", "/bindings/{customer}/{side}/{channel}", (p) => { const c = decodeURIComponent(p.customer), n = S.bindings.length; S.bindings = S.bindings.filter((x) => !(x.customer === c && x.side === p.side && x.channel === p.channel)); if (S.bindings.length === n) throw new HTTP(404, "nothing bound there"); return { deleted: [c, p.side, p.channel] }; });
  route("GET", "/spaces", () => FX.spaces);
  route("GET", "/products", () => FX.products);
  route("GET", "/products/{name}", (p) => { const x = FX.products.find((y) => y.name === p.name); if (!x) throw new HTTP(404, "product not found"); return x; });

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (!url.pathname.startsWith("/api/") || url.origin !== location.origin) return realFetch(input, init);
    const method = (init.method || "GET").toUpperCase();
    const path = url.pathname, q = Object.fromEntries(url.searchParams);
    let body; try { body = init.body ? JSON.parse(init.body) : undefined; } catch { body = undefined; }
    await new Promise((r) => setTimeout(r, 60 + Math.random() * 90));
    for (const [m, rx, f] of R) {
      if (m !== method) continue; const mm = path.match(rx); if (!mm) continue;
      try { const out = f(mm.groups || {}, body, q); if (method !== "GET") save(); return new Response(JSON.stringify(out), { status: 200, headers: { "Content-Type": "application/json" } }); }
      catch (e) { const st = e instanceof HTTP ? e.status : 500; return new Response(JSON.stringify({ detail: e instanceof HTTP ? e.detail : String(e) }), { status: st, headers: { "Content-Type": "application/json" } }); }
    }
    return new Response(JSON.stringify({ detail: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  };
  window.CYBA_DEMO = { reset() { try { localStorage.removeItem(KEY); } catch {} location.reload(); } };

  const bar = () => {
    if (document.getElementById("demoBar")) return;
    const d = document.createElement("div"); d.id = "demoBar";
    d.innerHTML = `<b>Live demo</b><span>Runs entirely in your browser – changes are saved locally, test runs never leave the page.</span><button type="button" id="demoReset">Reset demo</button><a href="https://github.com/cyberpanda/cyba-delta" target="_blank" rel="noopener">Source</a>`;
    document.body.appendChild(d); d.querySelector("#demoReset").onclick = () => window.CYBA_DEMO.reset();
  };
  new MutationObserver(bar).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener("DOMContentLoaded", bar);
})();
