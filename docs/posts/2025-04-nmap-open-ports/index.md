---
authors:
  - sdargoeuves
# categories:
#   - Writing
date:
  created: 2025-04-26
  # updated: 2025-03-03
draft: false
tags:
  - python
  - security
title: 'Unlocking Network Security: Use nmap to scan public IPs for open SSH ports'
---

"Can your product help with scanning public IP to check for open SSH ports?" - a question I received from a customer. The answer is yes, and I will show you how we used nmap to scan for open ports.
<!-- more -->

![AI generated image - An illustration depicting a modern cybersecurity setup. A large computer monitor displays nmap command outputs and security metrics, including open SSH ports, alongside a laptop showing code. The background features a digital network grid and icons representing security, such as padlocks. The overall theme emphasizes network security and technology.](network-security-nmap.png){ width=600 }
/// caption
<!-- keep empty to center the image, without a caption -->
///

This post discusses how to use nmap to scan for open ports on public IPs. It covers the use case, the steps to identify public IPs, and the Python code to scan the IPs using nmap.

Before diving into the details, let's understand the use case behind the question above.

!!!note "Disclaimer"
    The following content is based on a real-life scenario, but I will stay generic to not disclose any sensitive information.

## TL;DR

Need to check public IPs for open SSH ports for security compliance? This post shows you how to identify those IPs – either pulling them from a tool like IP Fabric or using a CSV file containing the list from your Source of Truth. Then, how to scan them using ⁠nmap via Python (⁠python3-nmap) and report the findings. Find the complete code and instructions on GitHub: [ipf-nmap-ip](https://www.github.com/sebastien-dargoeuves-ipf/ipf-nmap-ip)

## The Use Case

It all started on a Friday afternoon, when one of our Customer Success Managers asked me: "Seb, are you free, a customer has an interesting query, and I need your help". As I had nothing else to do -- yeah I wish! -- I responded, positively of course, as I was curious to find out more about this *interesting query* that was worth disturbing my Friday afternoon.

Let's deep dive into the What, Why, and How behind this query.

### What is the request?

The customer's Security team asked to identify all public IPs where SSH was reachable from the outside. They wanted to ensure that they were not exposing any unnecessary services to the internet.

As with every compliance rule, the goal is not just to check on one specific day, but finding a repeatable way of performing that check frequently, with as little manual effort as possible.

### Why such request?

This request makes a lot of sense. A company will grow, sometimes by acquisition, which means you inherit infrastructure you don't fully understand. The last thing you want when integrating to your existing network is a back door to the IT systems you've spent countless time and money to secure.

Port 22 is commonly used for SSH, which provides remote access to systems. Unauthorized or forgotten SSH services can become entry points for attackers. Public IPs are accessible from the internet, making them prime targets for attacks. Regular scans help monitor which IPs are exposed and ensure that only intended services are accessible.

### How are we going to achieve this?

First, we need to identify what are the public IPs of our infrastructure. Only then can we scan them to check if SSH is open or not. That scan will have to be performed from outside to ensure the test provides relevant output.

## Step 1: Identify the public IPs

How will you identify the public IPs of your network?

Short answer: it depends!

Maybe you have a Source of Truth (SoT) where you can find all that information, in something like Netbox, Nautobot, Infrahub, Excel spreadsheet, homegrown tool, notepad, post-it attached to your screen... ok I will stop, but you get the idea. Whatever works for you. If that's the case, just get an export of that data, have it ready as a CSV file with the following columns: ⁠`IP`, `⁠Device`, `⁠Interface`, and you can use the script!

For the customer, they did not have a system with accurate data they could fully trust, and that was part of the issue. So for this, they've used their instance of IP Fabric, which has all that information up-to-date. Now to get this data, a simple API call will do the trick, then a small Python logic to only get the public IP, et voilà, we have our list of public IPs.

Let's look at the part of the script which will extract the IPs and keep only the public ones.

### Python code to extract data from IP Fabric and identify public IPs

```python
import ipaddress
import os

from ipfabric import IPFClient

# create the IPFClient to interact with IP Fabric
ipf = IPFClient(
    base_url=os.getenv("IPF_URL"),
    token=os.getenv("IPF_TOKEN"),
    verify=eval(os.getenv("IPF_VERIFY", "True").title()),
    snapshot_id=os.getenv("IPF_SNAPSHOT_ID", "$last"),
)

# Optional: Filter out RFC1918 IPs
# This is not required, but it allows us to get a smaller list of IPs from IP Fabric
public_ip_filter = {
    "ip": [
        "nreg",
        "(^10\.)|(^172\.1[6-9])|(^172\.2[0-9])|(^172\.3[0-1])|(^192\.168)",
    ]
}
public_ips = ipf.technology.addressing.managed_ip_ipv4.all(filters=public_ip_filter)

# Now we are going to use the function is_public_ip to keep only the public IPs
def is_public_ip(ip):
    """Check if the given IP address is public."""
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_global  # Return True if it's public
    except ValueError:
        logger.error(f"Invalid IP address: {ip}")
        return False  # Invalid IP addresses are treated as non-public

# We can now filter all non-public IPs to get our final list
public_ips_list = [
    {"device": ip["hostname"], "ip": ip["ip"], "interface": ip["intName"]}
    for ip in public_ips
    if is_public_ip(ip["ip"])
]
```

## Step 2: Scan the public IPs

Now that we have our list of public IPs, we can start scanning them. For this, we will use nmap, a network scanning tool that can be used to discover hosts and services available on a network. It can be used to scan for open ports, identify services running on those ports, and gather information about the target systems.

Quick look at the doc for nmap (by that, I mean I asked AI how to use nmap), here is what I tried to check for open ports between my machine and a specific IP:

### nmap command to scan for open ports

```bash
╰─❯ nmap 1.1.1.1 -p 22,23,80,443,8443
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-11 10:46 BST
Nmap scan report for one.one.one.one (1.1.1.1)
Host is up (0.042s latency).

PORT     STATE    SERVICE
22/tcp   filtered ssh
23/tcp   filtered telnet
80/tcp   open     http
443/tcp  open     https
8443/tcp open     https-alt

Nmap done: 1 IP address (1 host up) scanned in 1.41 seconds
```

This is a great start!

There are a lot of arguments you can use to improve the use of nmap. To skip the host discovery part, we decided to use this argument `-Pn: Treat all hosts as online -- skip host discovery`.

### Python code to scan using python-nmap - first draft

In the first version, I used the `nmap.PortScanner()` from the `nmap` library you can install using `pip install python-nmap`. This worked as expected!

```python
import nmap
def scan_ip_addresses(ip_info_list, port):
    # Create a PortScanner object
    nm = nmap.PortScanner()
    results = []

    # Process IPs in batches of 5
    for i in range(0, len(ip_info_list), 5):
        batch = ip_info_list[i : i + 5]
        ip_string = " ".join(info["ip"] for info in batch)  # Extract IPs for the scan
        logger.info(f"Scanning batch {i + 1}-{i + len(batch)}: {ip_string}")

        try:
            # Perform the scan with -Pn option for the batch of IPs
            nm.scan(ip_string, str(port), arguments="-Pn")

            for info in batch:
                ip = info["ip"]
                # Initialize result for the current IP
                result = {
                    "IP": ip,
                    "Device": info["device"],
                    "Interface": info["interface"],
                    "Status": nm[ip].state(),
                    "Port": port,
                    "Port State": None,
                    "Reason": None,
                }

                # Check the state of the specified port
                if port in nm[ip]["tcp"]:
                    result["Port State"] = nm[ip]["tcp"][port]["state"]
                    result["Reason"] = nm[ip]["tcp"][port]["reason"]
                else:
                    result["Port State"] = "not found"
                    result["Reason"] = "Port not found in scan results."

                results.append(result)

        except Exception as e:
            logger.error(f"Error during scan for batch {ip_string}: {e}")
            results.extend(
                {
                    "IP": info["ip"],
                    "Device": info["device"],
                    "Interface": info["interface"],
                    "Status": "down",
                    "Port": port,
                    "Port State": "error",
                    "Reason": str(e),
                }
                for info in batch
            )
    return results
```

### Similar code, now using python3-nmap

After this first draft, I found out the library ⁠`python3-nmap` has had more recent updates. For that reason, I decided to use it, instead of the first draft.
The code is now using the ⁠`nmap3.NmapScanTechniques()` from the ⁠`nmap3` library. You can install using `⁠pip install python3-nmap`, and as far as I can see, it works just as well. Better or worse, no idea, I haven't done a lot of testing with it...

Here is the new code:

```python
import nmap3
def scan_nmap_ip_addresses(ip_info_list: list, ports: str = "22"):
    """
    Scan IP addresses using nmap.

    Args:
        ip_info_list: A list of dictionaries containing IP addresses, device names, and interfaces.
        ports: The ports to scan, i.e., "22-23,80,443".

    Returns:
        A list of dictionaries containing the scan results.
    """
    nmap = nmap3.NmapScanTechniques()
    ip_string = " ".join(row["IP"] for row in ip_info_list)

    scan_result = nmap.nmap_tcp_scan(
        ip_string, args=f"-p {ports} -Pn"
    )  # -Pn option to skip host discovery (no ping)

    output = []
    for info in ip_info_list:
        ip = info["IP"]
        # Initialize result for the current IP
        for result_port in scan_result[ip]["ports"]:
            result = {
                "IP": ip,
                "Device": info["Device"],
                "Interface": info["Interface"],
                "Protocol": result_port["protocol"],
                "Port": result_port["portid"],
                "Port State": result_port["state"],
                "PortReason": result_port["reason"],
            }
            output.append(result)

    return output
```

## Conclusion

Now that we have seen how to collect all the public IPs and find a way to perform that scan, we can easily generate the report showing us what is reachable or not.
The beauty is, if tomorrow someone configures a new public IP, or a new device is added to the network, I don't have to reinvent the wheel, or spend hours going through everything again, I can just run the same full script, and everything will be done for me.

No more need for the Security team to get in touch with me, I can automate the execution of this script, so that they receive on a daily/weekly/monthly basis, the updated report, which will let them know what is reachable.

One important caveat to note here, ideally, the script should be executed from a resource outside of the company, so you can accurately test what is reachable from the outside, rather than from internally.

!!! warning "Disclaimer"
    Be careful where you will run this from, the customer mentioned that running the script from a public Cloud resource was detected as a scanning attempt... which I guess was the point. They had to prove it was intentional and genuine, and not some attack.

The full code is available here: [ipf-nmap-ip](https://www.github.com/sebastien-dargoeuves-ipf/ipf-nmap-ip), check the README for the instructions on how to use it.

Please let me know any issues, comments... Thank you for reading all the way to the end!
