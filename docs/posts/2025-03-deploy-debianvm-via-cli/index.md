---
authors:
  - sdargoeuves
# categories:
#   - Linux
date:
  created: 2025-03-14
  # updated: 2025-03-03
draft: true
tags:
  - linux
title: 'Creating Debian VM on a local server via CLI'
---

Need a Debian VM running locally? Here's how you can create one on your server, just like you would in the cloud of your choice.

<!-- more -->

## Introduction

Let's face it, spinning up a VM in the cloud for every little test can be overkill, not to mention potentially costly. Sometimes, you just need a VM right here, right now, running locally on your machine or a local server.

Normally, if I need a linux VM to test something locally, I would use multipass, which allows you to quickly create an Ubuntu VM. I should write a post about this tool, it's a very useful tool to create a local VM quickly. Unfortunately, multipass doesn't support Debian 😞, I think only Ubuntu.

But this time, I needed a Debian VM and I wanted it running on my local server. And by "server," I'm talking about a not-too-old laptop, with 32GB of RAM running Ubuntu. The goal was CLI all the way – no GUI needed, for maximum automation potential.

## Prerequisites

To be checked and completed later, I already had qemu, libvirt, virsh installed on my server....

## Deploy the Debian VM

### Download the Debian image

Thinking about starting with a clean install, I attempted to download the latest iso, but I realised that this is the format for the installer, not the image. With this in mind, I then downloaded the qcow2 `nocloud` image from the [Debian website](https://cloud.debian.org/images/cloud/).

```bash
curl -LO https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-nocloud-amd64.qcow2
```

### Resize the image

Now, the downloaded image comes in at a compact 3GB.  That's fine for a minimal setup, but if you're planning to do anything substantial inside the VM, you'll quickly run out of space.  Let's resize it to something more practical, like 30GB in our case.

``` bash title="Confirm image size - input"
qemu-img info debian-12-nocloud-amd64.qcow2
```

``` bash title="Confirm image size - output"
image: debian-12-nocloud-amd64.qcow2
file format: qcow2
virtual size: 3 GiB (3221225472 bytes)
disk size: 397 MiB
cluster_size: 65536
Format specific information:
    compat: 1.1
    compression type: zlib
    lazy refcounts: false
    refcount bits: 16
    corrupt: false
    extended l2: false
Child node '/file':
    filename: debian-12-nocloud-amd64.qcow2
    protocol type: file
    file length: 397 MiB (416745984 bytes)
    disk size: 397 MiB
```

Using `qemu-img`, let's resize the image to 30GB:

``` bash title="Resize the image - input"
qemu-img resize debian-12-nocloud-amd64.qcow2 30G
```

``` bash title="Resize the image - output"
Image resized.
```

You can confirm you now have a 30GB image:

```bash title="Confirm image size - input"
qemu-img info debian-12-nocloud-amd64.qcow2
```

```bash title="Confirm image size - output"
image: debian-12-nocloud-amd64.qcow2
file format: qcow2
virtual size: 30 GiB (32212254720 bytes)
[...]
```

## Create the VM

With our image prepped, it's time to bring the VM to life! We'll use ⁠virt-install for this.  You could use a raw ⁠qemu command directly, but ⁠virt-install wraps things up nicely and I've used ⁠virsh tools before, so it feels like a comfortable choice for this.

``` bash title="Create the VM - input"
sudo virt-install \
    --name debipf \
    --memory 8192 \
    --vcpus 4 \
    --disk path=debian-12-nocloud-amd64.qcow2,device=disk,bus=virtio \
    --network network=default,model=virtio \
    --graphics none \
    --os-variant debian12 \
    --accelerate \
    --import
```

Let's break down the options used:

- `--name debipf`: This option sets the name of your VM
- `--memory 8192`: Memory in MB - 8192MB = 8GB RAM for the VM. Adjust as needed!
- `--vcpus 4`: This is the number of virtual CPUs to allocate to the VM.
- `--disk path=debian-12-nocloud-amd64.qcow2,device=disk,bus=virtio`: Points to our downloaded and resized ⁠qcow2 image, and tells the VM to treat it as a ⁠virtio disk.
- `--network network=default,model=virtio`: Sets up networking using the 'default' network and ⁠virtio again for network interface efficiency.
- `--graphics none`: This disables the graphical console for the VM, we're going headless.
- `--os-variant debian12`: Helps ⁠virt-install optimize settings for Debian 12.
- `--accelerate`: Use hardware virtualization extensions for better performance
- `--import`: Tells ⁠virt-install we are importing an existing disk image, not creating a new one from scratch.

After a few seconds, you should see the Debian system booting up and the login prompt appearing. You can now log in and start using your Debian VM, using username `root` and no password.

``` bash title="Create the VM - output"
[  OK  ] Finished systemd-update-ut… - Record Runlevel Change in UTMP.

Debian GNU/Linux 12 localhost ttyS0

localhost login: root
Linux localhost 6.1.0-31-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.128-1 (2025-02-07) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
Last login: Sat Mar 15 01:29:56 UTC 2025 on ttyS0
root@localhost:~#
```

### Expand the filesystem

Almost there! Remember we resized the disk image to 30GB?  Well, the filesystem inside the VM still thinks it's only 3GB.  The last crucial step is to expand the filesystem to actually use that extra space we allocated.

``` bash title="Expand the filesystem - input"
sudo apt update && sudo apt install -y cloud-guest-utils
growpart /dev/vda 1
```

``` bash title="Expand the filesystem - output"
CHANGED: partition=1 start=262144 old: size=6027264 end=6289407 new: size=62652383 end=62914526
```

### Connect to the VM using the console

Need to get into the VM's console directly?  No problem, ⁠virsh console to the rescue:

``` bash title="Connect to the VM"
sudo virsh console debipf
```

### Enable SSH access

If you want to connect to the VM via SSH, you will need to install the `openssh-server` package:

``` bash title="Install openssh-server"
sudo apt update && sudo apt install -y openssh-server
```

You just need to copy your SSH public key to the authorized_keys file, and you will be able to connect to your VM via SSH:

``` bash title=""
echo "ssh-rsa XXXXX..." >> /root/.ssh/authorized_keys
```

## Delete the VM

If you want to delete the VM, you can use the following command:

``` bash title="Delete the VM"
sudo virsh destroy debipf && sudo virsh undefine debipf --remove-all-storage
```

## Summary

So there you have it! A Debian VM up and running locally via the command line.  Quick, efficient, and perfect for local testing.  Enjoy!

### From the host

``` bash title="Only one time"
curl -LO https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-nocloud-amd64.qcow2
qemu-img info debian-12-nocloud-amd64.qcow2
qemu-img resize debian-12-nocloud-amd64.qcow2 30G
qemu-img info debian-12-nocloud-amd64.qcow2
```

``` bash title="Each time you want to create a new Debian VM"
sudo virt-install \
    --name debipf \
    --memory 8192 \
    --vcpus 4 \
    --disk path=debian-12-nocloud-amd64.qcow2,device=disk,bus=virtio \
    --network network=default,model=virtio \
    --graphics none \
    --os-variant debian12 \
    --accelerate \
    --import
```

### From the VM (guest)

``` bash
# Optional: connect to the VM via console
# sudo virsh console debipf
# enter the username
root
# expand the filesystem
sudo apt update && sudo apt install -y cloud-guest-utils openssh-server
growpart /dev/vda 1
# add your ssh public key
echo "ssh-rsa XXXXX..." >> /root/.ssh/authorized_keys
```
