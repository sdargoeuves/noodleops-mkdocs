---
authors:
  - sdargoeuves
categories:
  - netlab
date:
  created: 2026-09-18
  # updated: 2026-10-02
draft: false
tags:
  - netlab
title: "Challenging the Status Quo: HomeLab Memory Usage and Optimization"
---

It’s been quiet on the blog for a while, but a recent realization in the lab was too good not to share.

<!-- more -->

![AI generated image - The image depicts A clean, modern flat-illustration of a network engineer holding a magnifying glass over a small rack of virtual servers, with translucent memory-usage gauges floating above each device showing different fill levels, some full, some nearly empty. The mood is curious and analytical, not critical. Blue and orange tech palette, minimalist vector style, no text overlays.](lab-memory-usage01.png){ width=600 }
/// caption
<!-- keep empty to center the image, without a caption -->
///

## Introduction

When building virtual network labs, it is so easy to fall into comfortable habits. For a long time, Arista cEOS was my absolute default. Why would you want anything else? It boots in seconds, has a familiar Cisco-like CLI, works reliably with Containerlab and `netlab`, most networking stuff works on it... it gets the job done.

If it works, is fast, and feels comfortable, why question it?

## The Spark: Building Lab Observability

The turning point started while listening to the [Network Automagic NA011](https://networkautomagic.net/podcast/na011/) with Ivan Pepelnjak, when he mentioned that a pull request to display memory usage of running nodes in `netlab` would be a welcome contribution.

That piqued my curiosity: how hard could it be to pull memory metrics across a lab? Turns out, hard enough to be interesting.

- `libvirt` devices were pretty straightforward: `virsh domstats` gave me what I needed.
- Containers needed a different approach since virsh has no idea they exist. The command `docker stats --no-stream` did the trick... until I tested with Podman, which reported similar data but using a different metric and a slightly different structure...

Three sources, three formats, all needing to be normalized before they could be summed up and displayed in something human-readable.

Long story short: I put together the PR(s), it got merged, and we can now run `netlab status --memory` to see exactly what every node in the topology is eating across both containers and VMs.

## The Realization Moment

Once the feature was live, I ran it against our main multi-vendor lab.

And that's when the realization hit.

cEOS isn't the most memory-hungry image out there by any means, but knowing it was my "default box," we had **28 cEOS instances** running across the topology. Looking at the table, each cEOS container was consuming an average of **1.7 GB of RAM** (ranging between 1.6 GB and 2.0 GB in practice).

Nearly **48 GB of host RAM** was dedicated to keep those 28 devices alive. And the worst part? A lot of those nodes were doing nothing fancy at all, just acting as basic L2 access switches running spanning-tree!

I asked myself: *Do I really need a full 1.7 GB cEOS instance for all 28 of these nodes?* The answer was a clear **no**.

## Challenging the Defaults

I knew `netlab` supported Cisco IOL and IOL-L2, but from a Cisco perspective, I was happily running about 30x IOSv devices, and never questioned those choices, until I've heard about a potential [sunset for IOSv](https://github.com/ipspace/netlab/discussions/3714#discussioncomment-17823510) in `netlab`.

This is when I decided to investigate alternative options, like IOL & IOL-L2:

- **For basic L2 switches (and more):** IOL-L2 is brilliant. It does VLANs, trunking, spanning-tree, MAC address learning at a fraction of the cost compared to cEOS. And I've later realized it does cover more than just layer 2 functionalities, you can configure OSPF, EIGRP, RIP (yes I know, but it's a lab!). I just haven't tried BGP. All this for less than **200 MB of RAM** per node.
- **For routing/transit hops:** Standard IOL does the job of a router. I've tested with OSPF and BGP, and recently successfully added PIM for the multicast part of the lab. IOL takes a similar amount of resources as IOL-L2.
- **For ultra-lightweight routing:** While FRR wasn't the main platform required for this lab, they are an excellent alternative, faster than cEOS to boot, familiar CLI once you type the `vtysh` command, and use a ridiculous **~35 MB of RAM** per node.

## Migration

With this information in hand, it was time to retire IOSv and change about half of the cEOS nodes with IOL, IOL-L2, and FRR where appropriate. The goal was never to remove cEOS entirely (I still enjoy playing with those devices), just to use the lab's memory more efficiently.

During the migration, I also took the opportunity to clean up the topology, and grow the lab:

- Added a **3rd spine** to our DC CLOS fabric (because why not, we had the room!).
- Tidied up **spanning-tree configurations** after realising that cEOS defaults to MSTP, whereas IOL-L2 defaults to RPVST, so if you are not careful, you could end up with unexpected spanning-tree behavior.

## The Math: Before vs. After

Here is what the memory footprint looked like before and after right-sizing:

- **Before (All cEOS):**  
  28× cEOS @ ~1.7 GB = **~47.6 GB of RAM**

- **After (Right-Sized Mix):**  
  - 12× cEOS (@ ~1.7 GB) = ~20.40 GB
  - 12× IOL-L2 (@ ~170 MB) = ~2.04 GB
  - 4× IOL (@ ~190 MB) = ~0.76 GB
  - 2× FRR (@ ~35 MB) = ~0.07 GB
  - **Total: ~23.3 GB of RAM**

By simply replacing one vendor image for another on those devices, the memory footprint was cut in half, saving **over 24 GB of host RAM**, all while improving the lab overall.

## The Takeaway

Just because something is easy, fast, and comfortable doesn’t mean it should be your default for every single scenario.

I took cEOS for granted because it worked so well. But taking a step back, measuring actual resource costs, and picking the right tool for the job gave us back 24 GB of memory, giving the host some more headroom to simulate larger, more realistic multi-vendor environments.

Challenge your defaults. You might be surprised at what you find under the hood.

*(P.S. Now that the fabric is right-sized, if anyone has a clever idea on how to slim down the 32 GB appetite of Cisco SD-WAN Manager... I'm all ears 😄)*

```
╰─❯ netlab status --memory
Lab 1 in /my-lab-directory
  status:      started
  topology:    topology.yml
  provider(s): libvirt,clab
  memory used: 134.060GiB

┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━┓
┃ node             ┃ device   ┃ image                                      ┃ mgmt IP       ┃ connection  ┃ provider ┃ VM/container               ┃ status               ┃ memory    ┃
┡━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━╇━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━┩
│ sdwan-manager    │ linux    │ vrnetlab/cisco_sdwan-manager:20.16.1       │ 10.194.56.130 │ docker      │ clab     │ clab-ml-1-sdwan-manager    │ Up 7 hours (healthy) │ 32.620GiB │
├──────────────────┼──────────┼────────────────────────────────────────────┼───────────────┼─────────────┼──────────┼────────────────────────────┼──────────────────────┼───────────┤
│ sdwan-controller │ linux    │ vrnetlab/cisco_sdwan-controller:20.16.1    │ 10.194.56.131 │ docker      │ clab     │ clab-ml-1-sdwan-controller │ Up 7 hours (healthy) │ 1.013GiB  │
├──────────────────┼──────────┼────────────────────────────────────────────┼───────────────┼─────────────┼──────────┼────────────────────────────┼──────────────────────┼───────────┤
│ sdwan-validator  │ linux    │ vrnetlab/cisco_sdwan-validator:20.16.1     │ 10.194.56.132 │ docker      │ clab     │ clab-ml-1-sdwan-validator  │ Up 7 hours (healthy) │ 884.3MiB  │
├──────────────────┼──────────┼────────────────────────────────────────────┼───────────────┼─────────────┼──────────┼────────────────────────────┼──────────────────────┼───────────┤
│ edge1x01         │ cat8000v │ vrnetlab/cisco_c8000v:controller-17.15.04c │ 10.194.56.133 │ network_cli │ clab     │ clab-ml-1-edge1x01         │ Up 7 hours (healthy) │ 4.034GiB  │
├──────────────────┼──────────┼────────────────────────────────────────────┼───────────────┼─────────────┼──────────┼────────────────────────────┼──────────────────────┼───────────┤
│ edge2x01         │ cat8000v │ vrnetlab/cisco_c8000v:controller-17.15.04c │ 10.194.56.134 │ network_cli │ clab     │ clab-ml-1-edge2x01         │ Up 7 hours (healthy) │ 4.032GiB  │
├──────────────────┼──────────┼────────────────────────────────────────────┼───────────────┼─────────────┼──────────┼────────────────────────────┼──────────────────────┼───────────┤
│ edge3x01         │ cat8000v │ vrnetlab/cisco_c8000v:controller-17.15.04c │ 10.194.56.135 │ network_cli │ clab     │ clab-ml-1-edge3x01         │ Up 7 hours (healthy) │ 4.120GiB  │
├──────────────────┼──────────┼────────────────────────────────────────────┼───────────────┼─────────────┼──────────┼────────────────────────────┼──────────────────────┼───────────┤
```
