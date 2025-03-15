---
authors:
  - sdargoeuves
# categories:
#   - Writing
date:
  created: 2025-03-08
  # updated: 2025-03-03
draft: true
tags:
  - python
  - security
title: 'Using nmap to tests open ports'
---

"Can your product help with scanning public IP to check for open SSH ports?" - a question I received from a customer. The answer is yes, and I will show you how we used nmap to scan for open ports.
<!-- more -->

Before diving into the nitty-gritty details, let's understand the use case behind the question above.

!!!note "Disclaimer"
    The following content is based on a real-life scenario, but I will stay generic to not disclose any sensitive information.

## The Use Case

It all started on a Friday afternoon, with one of our Customer Success Manager telling me: "Seb, are you free, a customer has an interesting query, and I need your help". As I had nothing else to do -- yeah I wish! -- I responded positively, of course, I was curious to find out more about this *interesting query* that was worth disturbing my Friday afternoon.

Let's deep dive into the What, Why and How behind this query.

### What is the request?

The customer's Security team asked to identify all public IPs where SSH was reachable from the outside. They wanted to ensure that they were not exposing any unnecessary services to the internet.
As with every compliance rule, the goal is not just to check on one specific day, but finding a repeatable way of performing that check frequently, with as little manual effort as possible.

### Why such request?

(needs rewriting)
Port 22 is commonly used for SSH, which provides remote access to systems. Unauthorized or forgotten SSH services can become entry points for attackers.
Public IPs are accessible from the internet, making them prime targets for attacks.
Regular scans help monitor which IPs are exposed and ensure that only intended services are accessible.

### How are we going to achieve this?

...

## Conclusion

...
