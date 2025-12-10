## Check Point post – editing checklist

- [x] **Overview intro paragraph**  
  Replace the current paragraph under `### Overview` that starts with `Welcome to this, quite long, blog post` with:
  ```markdown
  Welcome to this fairly long post — but don't worry, we'll walk through it step by step. The goal is to guide you through deploying a Check Point firewall in your lab, from downloading the image to having a working firewall in *netlab*.
  ```

- [x] **Overview bullet list – consistency and *netlab***  
  Replace the list under `**Here is what we are going to do:**` with:
  ```markdown
  - Create and configure a standalone Check Point firewall VM from the official KVM image
  - Configure the management interface with your chosen IP address
  - Run the First Time Wizard (via CLI) and apply additional settings
  - Build a Vagrant box from the VM
  - Use the box with *netlab* to deploy a Check Point firewall in your lab
  ```

- [x] **Prerequisites lead‑in sentence**  
  Replace the line:
  ```markdown
  To follow this guide, we will assume:
  ```
  with:
  ```markdown
  To follow this guide, you'll need:
  ```

- [x] **Static IP explanation – tighten wording**  
  Replace the paragraph beginning with `**Why configure a static IP here?**` down to `...remaining consistent.` with:
  ```markdown
  **Why configure a static IP here?** If you remove the `network` section, the VM will get an IP address via DHCP during the boot process. While this works initially, Check Point records this DHCP-assigned IP as the management server address. Later, when you create a VM from this box, if the DHCP server assigns a *different* IP address to eth0, it will create a mismatch that breaks policy installation, certificate management, and other critical functions that depend on the management IP remaining consistent.
  ```

- [x] **DHCP explanation – remove hedging**  
  In the bullet point under `##### RUNCMD > Enable DHCP on eth0` that starts with `**Static IP during First Time Wizard**`, replace the second sentence:
  ```markdown
  If you use DHCP at this stage, it will likely assign an IP from the default vagrant subnet, probably not the one used by netlab. Additionally, Vagrant cannot detect the IP without DHCP enabled, or I haven't found a way for this.
  ```
  with:
  ```markdown
  If you use DHCP at this stage, it will likely assign an IP from the default Vagrant subnet, probably not the one used by *netlab*. Additionally, Vagrant cannot reliably detect the IP unless DHCP is enabled.
  ```

- [x] **Time loop description – grammar fix**  
  Replace:
  ```markdown
  The above script reset the system time using two mechanisms:
  ```
  with:
  ```markdown
  The above script resets the system time using two mechanisms:
  ```

- [x] **Docker/Windows line – small grammar fix**  
  Replace:
  ```markdown
  Yes, and it is was a lot easier than it sounds, thanks to Docker 🐳 and this project: [dockur/windows](https://github.com/dockur/windows)
  ```
  with:
  ```markdown
  Yes, and it was a lot easier than it sounds, thanks to Docker 🐳 and this project: [dockur/windows](https://github.com/dockur/windows)
  ```

- [x] **Capitalization and *netlab* consistency**  
  In the `!!! tip "Automate Firewall Rules"` block, replace:
  ```markdown
  My final vagrant box has the default cleanup rule blocking all traffic, I will use the playbook to automate the firewall rules after the VM is created in netlab.
  ```
  with:
  ```markdown
  My final Vagrant box has the default cleanup rule blocking all traffic. I use the playbook to automate the firewall rules after the VM is created in *netlab*.
  ```

- [ ] **Intro disclaimer – slightly tighter wording**  
  Replace the text inside the `!!! info "Disclaimer"` block with:
  ```markdown
  This post will look similar to the FortiGate guide I published earlier, but it was significantly more fiddly to arrive at a working solution for Check Point.
  ```

- [ ] **Important limitation – emphasize static nature once**  
  In the `### Important Limitation: Static Management IP` section, replace:
  ```markdown
  **Unlike most Vagrant boxes, this Check Point box requires a pre-configured management IP address.**
  ```
  with:
  ```markdown
  **Unlike most Vagrant boxes, this Check Point box requires a statically pre-configured management IP address.**
  ```

- [ ] **Important limitation – netlab italics consistency**  
  In the bullet list under `**What this means for you:**`, replace:
  ```markdown
  - The management IP must match what you'll use in your netlab topology
  ```
  with:
  ```markdown
  - The management IP must match what you'll use in your *netlab* topology
  ```

- [ ] **Prerequisites – Check Point image sentence polish**  
  In the `!!! note "Check Point image"` block, replace:
  ```markdown
  An account on the [Check Point support portal](https://support.checkpoint.com/) to download the Check Point CloudGuard image.
  ```
  with:
  ```markdown
  An account on the [Check Point support portal](https://support.checkpoint.com/) so you can download the Check Point CloudGuard image.
  ```

- [ ] **Prerequisites – System Requirements bullets spacing**  
  In the `!!! note "System Requirements"` block, ensure there is a blank line between the introductory line and the bullet list, and that all bullets start with `- **` (CPU, RAM, Disk space, etc.) for consistent formatting.

- [ ] **RUNCMD > Create Time loop – emoji spacing**  
  In the sentence:
  ```markdown
  It means the VM will never be more than 7 days old... you may find it useful 🙈🙉🙊
  ```
  insert a space before the ellipsis and slightly adjust punctuation:
  ```markdown
  It means the VM will never be more than 7 days old ... you may find it useful 🙈🙉🙊
  ```

- [ ] **Using the box with netlab – minor comments tidy**  
  In the `links:` section of the topology example, standardize the inline comments by capitalizing `netlab` and adding a period, e.g.:
  ```markdown
      # ipv4: 172.60.40.2/30 # netlab does not configure Check Point configuration, so we will have to do it ourselves later.
  ```

- [ ] **Appendix – small wording fixes in Boxen section**  
  In the `### Attempt with Boxen` summary paragraph, replace:
  ```markdown
  infact very similar to what we've done with the FortiGate VM
  ```
  with:
  ```markdown
  in fact very similar to what we've done with the FortiGate VM
  ```
  and in the `!!! note "Image selection"` block, change:
  ```markdown
  but I went for the R81_20 as I had an issue with R82, but did not explored further.
  ```
  to:
  ```markdown
  but I went for R81_20 as I had an issue with R82 and did not explore it further.
  ```

