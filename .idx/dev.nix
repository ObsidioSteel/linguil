{pkgs}:
{
  # This file configures the development environment using Nix.
  # For more information, see: https://firebase.google.com/docs/studio/customize-workspace

  # Specifies the Nixpkgs channel to use for package management.
  channel = "stable-24.11";

  # Lists the packages to be installed in the environment.
  # You can find more packages at https://search.nixos.org/packages.
  packages = [
    # Node.js version 20.
    pkgs.nodejs_20
    # Zulu OpenJDK.
    pkgs.zulu
    # Google Cloud SDK for Firebase and other GCP services.
    pkgs.google-cloud-sdk
  ];

  # Configures the Firebase emulators.
  services.firebase.emulators = {
    # Emulators are disabled as the app is currently using production backends.
    detect = false;
    # The Firebase project ID.
    projectId = "linguil";
    # The Firebase services to emulate.
    services = [ "auth" "firestore" "functions" ];
  };

  # VS Code and workspace settings for the IDX environment.
  idx = {
    # A list of VS Code extensions to install.
    # You can find extensions on https://open-vsx.org/ and use the "publisher.id" format.
    extensions = [
      # e.g., "vscodevim.vim"
    ];

    # Workspace-specific configurations.
    workspace = {
      # Actions to take when the workspace is created.
      onCreate = {
        # Files to automatically open when the workspace starts.
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };

    # Configuration for the preview feature.
    previews = {
      # Enable or disable previews.
      enable = true;
      # Defines the previews to be available.
      previews = {
        web = {
          # The command to run to start the web preview.
          command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          # The manager for this preview type.
          manager = "web";
        };
      };
    };
  };
}